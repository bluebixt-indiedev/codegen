use axum::{
    body::Body,
    extract::{Path as AxumPath, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use std::{collections::HashMap, path::PathBuf, process::Stdio};
use tokio::process::Command;
use tokio_util::io::{ReaderStream, StreamReader};
use futures::StreamExt;

use super::storage;

/// Axum state — you can add DB pool later
#[derive(Clone)]
pub struct AppState {}

/// GET /{owner}/{repo}/info/refs?service=git-upload-pack
pub async fn handle_info_refs(
    AxumPath((owner, repo)): AxumPath<(String, String)>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Response, (StatusCode, String)> {
    let repo_name = repo.trim_end_matches(".git");
    let repo_path = storage::get_repo_path(&owner, repo_name);

    if!repo_path.exists() {
        return Err((StatusCode::NOT_FOUND, "repo not found".into()));
    }

    let service = params.get("service").cloned().unwrap_or_default();
    if service!= "git-upload-pack" && service!= "git-receive-pack" {
        return Err((StatusCode::BAD_REQUEST, "invalid service".into()));
    }

    // git upload-pack --stateless-rpc --advertise-refs {repoPath}
    let service_short = &service[4..]; // strip "git-" -> "upload-pack"
    let mut cmd = Command::new("git")
       .args([service_short, "--stateless-rpc", "--advertise-refs"])
       .arg(&repo_path)
       .stdout(Stdio::piped())
       .spawn()
       .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let stdout = cmd.stdout.take().unwrap();
    let stream = ReaderStream::new(stdout);

    // Wait in background so we don't zombie
    tokio::spawn(async move { let _ = cmd.wait().await; });

    let content_type = format!("application/x-{}-advertisement", service);

    Ok(Response::builder()
       .status(StatusCode::OK)
       .header(header::CONTENT_TYPE, content_type)
       .header(header::CACHE_CONTROL, "no-cache")
       .body(Body::from_stream(stream))
       .unwrap())
}

/// POST /{owner}/{repo}/git-upload-pack and /git-receive-pack
pub async fn handle_service(
    AxumPath((owner, repo, service)): AxumPath<(String, String, String)>,
    body: Body,
) -> Result<Response, (StatusCode, String)> {
    let repo_name = repo.trim_end_matches(".git");
    let repo_path = storage::get_repo_path(&owner, repo_name);

    if!repo_path.exists() {
        return Err((StatusCode::NOT_FOUND, "repo not found".into()));
    }

    let (git_service, content_type) = match service.as_str() {
        "git-upload-pack" => ("upload-pack", "application/x-git-upload-pack-result"),
        "git-receive-pack" => ("receive-pack", "application/x-git-receive-pack-result"),
        _ => return Err((StatusCode::BAD_REQUEST, "invalid endpoint".into())),
    };

    // Stream request body into git stdin, stream git stdout back
    let body_stream = body.into_data_stream();
    let stdin_reader = StreamReader::new(
        body_stream.map(|r| r.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e)))
    );

    let mut cmd = Command::new("git")
       .args([git_service, "--stateless-rpc"])
       .arg(&repo_path)
       .stdin(Stdio::piped())
       .stdout(Stdio::piped())
       .spawn()
       .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Pipe body -> git stdin
    if let Some(mut stdin) = cmd.stdin.take() {
        tokio::spawn(async move {
            let _ = tokio::io::copy(&mut tokio::io::BufReader::new(stdin_reader), &mut stdin).await;
        });
    }

    let stdout = cmd.stdout.take().unwrap();
    let out_stream = ReaderStream::new(stdout);
    tokio::spawn(async move { let _ = cmd.wait().await; });

    Ok(Response::builder()
       .status(StatusCode::OK)
       .header(header::CONTENT_TYPE, content_type)
       .header(header::CACHE_CONTROL, "no-cache")
       .body(Body::from_stream(out_stream))
       .unwrap())
}