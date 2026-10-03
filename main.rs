mod git;

use axum::{
    extract::{Path as AxumPath, Form},
    response::{Html, Redirect, IntoResponse},
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use std::fs;

#[derive(Deserialize)]
struct CreateForm {
    owner: String,
    name: String,
}

async fn homepage() -> Html<String> {
    let mut html = String::from("<h1>BlueBix Codegen (Rust)</h1><a href='/create'>+ New Repo</a><ul>");

    if let Ok(entries) = fs::read_dir("./data/repos") {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let owner = entry.file_name().to_string_lossy().to_string();
                    if let Ok(repos) = fs::read_dir(entry.path()) {
                        for repo in repos.flatten() {
                            let repo_name = repo.file_name().to_string_lossy().replace(".git", "");
                            html.push_str(&format!(
                                "<li><a href='/{}/{}'>{}/{}</a> — git clone https://codegencc.web.app/{}/{}.git</li>",
                                owner, repo_name, owner, repo_name, owner, repo_name
                            ));
                        }
                    }
                }
            }
        }
    }
    html.push_str("</ul>");
    Html(html)
}

async fn create_page() -> Html<&'static str> {
    Html(r#"
        <h1>Create Repo</h1>
        <form method="POST" action="/create">
        Owner: <input name="owner" placeholder="BlueBix" value="BlueBix"><br><br>
        Name: <input name="name" placeholder="myrepo"><br><br>
        <button>Create Bare Repo</button>
        </form>
        <br><a href="/">Back</a>
    "#)
}

async fn handle_create(Form(form): Form<CreateForm>) -> impl IntoResponse {
    if form.owner.is_empty() || form.name.is_empty() {
        return Redirect::to("/create").into_response();
    }
    match git::create_bare_repo(&form.owner, &form.name) {
        Ok(_) => Redirect::to(&format!("/{}/{}", form.owner, form.name)).into_response(),
        Err(e) => Html(format!("<h1>Error: {}</h1><a href='/create'>Back</a>", e)).into_response(),
    }
}

async fn repo_page(AxumPath((owner, repo)): AxumPath<(String, String)>) -> Html<String> {
    let repo_name = repo.trim_end_matches(".git");
    if!git::repo_exists(&owner, repo_name) {
        return Html(format!("<h1>404 - Repo {}/{} not found</h1><a href='/'>Home</a>", owner, repo_name));
    }
    let path = git::get_repo_path(&owner, repo_name);
    Html(format!(
        r#"<h1>{}/{}</h1>
        <p>Path: {}</p>
        <pre>git clone https://codegencc.web.app/{}/{}.git</pre>
        <a href="/">Back to list</a>"#,
        owner, repo_name, path.display(), owner, repo_name
    ))
}

#[tokio::main]
async fn main() {
    git::init().expect("init failed");
    let _ = git::create_bare_repo("BlueBix", "codegen");

    let app = Router::new()
        // Web UI
       .route("/", get(homepage))
       .route("/create", get(create_page).post(handle_create))
       .route("/:owner/:repo", get(repo_page))
        // Git Smart HTTP - this makes git clone work
       .route("/:owner/:repo/info/refs", get(git::protocol::handle_info_refs))
       .route("/:owner/:repo/:service", post(git::protocol::handle_service));

    println!("🚀 BlueBix Codegen (Rust) running on http://localhost:3000");

    let listener = tokio::net::TcpListener::bind("https://codegencc.web.app/").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}