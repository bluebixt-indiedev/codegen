use axum::{
    extract::{Form, Path as AxumPath, State},
    http::{HeaderMap, StatusCode},
    response::{Html, IntoResponse, Json, Redirect},
    routing::{get, post},
    Router,
};
use bcrypt::{hash, verify};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{query, query_as, SqlitePool};
use std::fs;
use std::path::PathBuf;
use std::process::Command;


#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[derive(Deserialize)]
struct CreateForm {
    owner: String,
    name: String,
}

#[derive(Deserialize)]
struct RegisterRequest {
    username: String,
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Deserialize)]
struct CreateRepoRequest {
    name: String,
    description: Option<String>,
}

#[derive(Deserialize)]
struct CommitFileRequest {
    path: String,
    content: String,
}

#[derive(Deserialize)]
struct CommitRequest {
    repo_name: String,
    message: String,
    files: Vec<CommitFileRequest>,
}

#[derive(Serialize)]
struct UserResponse {
    id: i64,
    username: String,
    email: String,
    created_at: String,
}

#[derive(Serialize)]
struct RepoResponse {
    id: i64,
    owner: String,
    name: String,
    description: String,
    created_at: String,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user: UserResponse,
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: i64,
    username: String,
    email: String,
    password_hash: String,
    created_at: String,
}

#[derive(sqlx::FromRow)]
struct RepoRow {
    id: i64,
    owner: String,
    name: String,
    description: String,
    created_at: String,
}

#[derive(Serialize, Deserialize)]
struct AuthClaims {
    sub: String,
    exp: usize,
}

#[derive(Deserialize)]
struct CommitFileRequest {
    path: String,
    content: String,
}

#[derive(Deserialize)]
struct CommitRequest {
    repo_name: String,
    message: String,
    files: Vec<CommitFileRequest>,
}

fn jwt_secret() -> &'static str {
    "codegen-dev-secret-change-me-in-production"
}

fn auth_error(message: &str, field: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "message": message,
            "field": field
        })),
    )
}

async fn ensure_db(state: &AppState) {
    let _ = query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&state.db)
    .await;

    let _ = query(
        r#"
        CREATE TABLE IF NOT EXISTS repositories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(owner, name)
        );
        "#,
    )
    .execute(&state.db)
    .await;
}

fn make_token(username: &str) -> Result<String, String> {
    let exp = (Utc::now() + Duration::hours(24)).timestamp() as usize;
    let claims = AuthClaims {
        sub: username.to_string(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .map_err(|e| format!("token issue: {e}"))
}

async fn get_user_by_username(state: &AppState, username: &str) -> Result<Option<UserRow>, sqlx::Error> {
    query_as::<_, UserRow>(
        "SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?"
    )
    .bind(username)
    .fetch_optional(&state.db)
    .await
}

async fn get_user_by_email(state: &AppState, email: &str) -> Result<Option<UserRow>, sqlx::Error> {
    query_as::<_, UserRow>(
        "SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?"
    )
    .bind(email)
    .fetch_optional(&state.db)
    .await
}

async fn get_authenticated_user(
    headers: &HeaderMap,
    state: &AppState,
) -> Result<UserRow, (StatusCode, Json<Value>)> {
    let header = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .ok_or((StatusCode::UNAUTHORIZED, Json(json!({"message": "Missing token"}))))?;

    let token = header
        .strip_prefix("Bearer ")
        .ok_or((StatusCode::UNAUTHORIZED, Json(json!({"message": "Invalid auth format"}))))?;

    let claims = decode::<AuthClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret().as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| (StatusCode::UNAUTHORIZED, Json(json!({"message": "Invalid token"}))))?;

    let username = claims.claims.sub;
    get_user_by_username(state, &username)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Database error"}))))?
        .ok_or((StatusCode::UNAUTHORIZED, Json(json!({"message": "User not found"}))))
}

async fn register_user(State(state): State<AppState>, Json(payload): Json<RegisterRequest>) -> impl IntoResponse {
    ensure_db(&state).await;

    let username = payload.username.trim();
    let email = payload.email.trim();
    let password = payload.password.trim();

    if username.is_empty() {
        return auth_error("Username cannot be empty", "username");
    }
    if username.len() < 3 {
        return auth_error("Username must be at least 3 characters", "username");
    }
    if !email.contains('@') || !email.contains('.') {
        return auth_error("Please enter a valid email address", "email");
    }
    if password.len() < 8 {
        return auth_error("Password must be at least 8 characters", "password");
    }
    if !password.chars().any(char::is_uppercase)
        || !password.chars().any(char::is_lowercase)
        || !password.chars().any(char::is_numeric)
        || !password.chars().any(|c| !c.is_alphanumeric() && !c.is_whitespace())
    {
        return auth_error(
            "Password must include uppercase, lowercase, a number, and a special character",
            "password",
        );
    }

    if get_user_by_username(&state, username).await.unwrap_or(None).is_some() {
        return auth_error("Username already exists", "username");
    }

    if get_user_by_email(&state, email).await.unwrap_or(None).is_some() {
        return auth_error("Email is already registered", "email");
    }

    let password_hash = match hash(password, 12) {
        Ok(hash) => hash,
        Err(_) => return auth_error("Could not secure password", "password"),
    };

    let insert_result = query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    )
    .bind(username)
    .bind(email)
    .bind(&password_hash)
    .execute(&state.db)
    .await;

    if insert_result.is_err() {
        return auth_error("User registration failed", "username");
    }

    let user = match get_user_by_username(&state, username).await {
        Ok(Some(user)) => user,
        _ => return auth_error("User could not be loaded after registration", "username"),
    };

    let token = match make_token(&user.username) {
        Ok(token) => token,
        Err(_) => return auth_error("Token generation failed", "username"),
    };

    (
        StatusCode::CREATED,
        Json(AuthResponse {
            token,
            user: UserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
            },
        }),
    )
}

async fn login_user(State(state): State<AppState>, Json(payload): Json<LoginRequest>) -> impl IntoResponse {
    ensure_db(&state).await;

    let username = payload.username.trim();
    let password = payload.password.trim();

    if username.is_empty() {
        return auth_error("Username cannot be empty", "username");
    }
    if password.is_empty() {
        return auth_error("Password cannot be empty", "password");
    }

    let user = match get_user_by_username(&state, username).await {
        Ok(Some(user)) => user,
        Ok(None) => return auth_error("Invalid username or password", "username"),
        Err(_) => return auth_error("Database error while logging in", "username"),
    };

    if !verify(password, &user.password_hash).unwrap_or(false) {
        return auth_error("Invalid username or password", "password");
    }

    let token = match make_token(&user.username) {
        Ok(token) => token,
        Err(_) => return auth_error("Token generation failed", "username"),
    };

    (
        StatusCode::OK,
        Json(AuthResponse {
            token,
            user: UserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
            },
        }),
    )
}

async fn get_current_user(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    match get_authenticated_user(&headers, &state).await {
        Ok(user) => (
            StatusCode::OK,
            Json(UserResponse {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
            }),
        ),
        Err((status, json)) => (status, json),
    }
}

async fn list_repositories(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let user = match get_authenticated_user(&headers, &state).await {
        Ok(user) => user,
        Err((status, json)) => return (status, json),
    };

    let rows = match query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE owner = ? ORDER BY created_at DESC"
    )
    .bind(&user.username)
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Could not load repositories"}))),
    };

    (
        StatusCode::OK,
        Json(rows
            .into_iter()
            .map(|repo| RepoResponse {
                id: repo.id,
                owner: repo.owner,
                name: repo.name,
                description: repo.description,
                created_at: repo.created_at,
            })
            .collect::<Vec<_>>()),
    )
}

async fn create_repository(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateRepoRequest>,
) -> impl IntoResponse {
    let user = match get_authenticated_user(&headers, &state).await {
        Ok(user) => user,
        Err((status, json)) => return (status, json),
    };

    let repo_name = payload.name.trim();
    if repo_name.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({"message": "Repository name is required"}))) ;
    }

    let description = payload.description.unwrap_or_default().trim().to_string();

    let existing = query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE owner = ? AND name = ?"
    )
    .bind(&user.username)
    .bind(repo_name)
    .fetch_optional(&state.db)
    .await;

    if existing.is_ok() && existing.unwrap().is_some() {
        return (StatusCode::BAD_REQUEST, Json(json!({"message": "Repository already exists"})));
    }

    match git::create_bare_repo(&user.username, repo_name) {
        Ok(_) => {}
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Could not create git repository on disk"})));
        }
    }

    let result = query(
        "INSERT INTO repositories (owner, name, description) VALUES (?, ?, ?)"
    )
    .bind(&user.username)
    .bind(repo_name)
    .bind(&description)
    .execute(&state.db)
    .await;

    if result.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Repository creation failed"})));
    }

    let repo = match query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE owner = ? AND name = ?"
    )
    .bind(&user.username)
    .bind(repo_name)
    .fetch_one(&state.db)
    .await
    {
        Ok(repo) => repo,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Failed to fetch created repo"}))),
    };

    (
        StatusCode::CREATED,
        Json(RepoResponse {
            id: repo.id,
            owner: repo.owner,
            name: repo.name,
            description: repo.description,
            created_at: repo.created_at,
        }),
    )
}

async fn delete_repository(
    State(state): State<AppState>,
    headers: HeaderMap,
    AxumPath(repo_id): AxumPath<i64>,
) -> impl IntoResponse {
    let user = match get_authenticated_user(&headers, &state).await {
        Ok(user) => user,
        Err((status, json)) => return (status, json),
    };

    let repo = match query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE id = ?"
    )
    .bind(repo_id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(repo) => repo,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Query failed"}))),
    };

    let repo = match repo {
        Some(repo) => repo,
        None => return (StatusCode::NOT_FOUND, Json(json!({"message": "Repository not found"}))),
    };

    if repo.owner != user.username {
        return (StatusCode::FORBIDDEN, Json(json!({"message": "You do not own this repository"})));
    }

    let result = query("DELETE FROM repositories WHERE id = ?")
        .bind(repo_id)
        .execute(&state.db)
        .await;

    if result.is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Could not delete repository"})));
    }

    let repo_path = git::get_repo_path(&repo.owner, &repo.name);
    let _ = fs::remove_dir_all(repo_path);

    (StatusCode::OK, Json(json!({"success": true, "deleted": repo_id})))
}

fn repo_worktree_path(owner: &str, repo_name: &str) -> PathBuf {
    PathBuf::from("forgejo/data/data/worktrees")
        .join(owner)
        .join(repo_name)
}

fn commit_files_in_repo(owner: &str, repo_name: &str, files: &[CommitFileRequest], message: &str) -> Result<String, String> {
    let bare_repo = git::get_repo_path(owner, repo_name);
    if !bare_repo.exists() {
        return Err("Repository does not exist".to_string());
    }

fn repo_worktree_path(owner: &str, repo_name: &str) -> PathBuf {
    PathBuf::from("forgejo/data/data/worktrees")
        .join(owner)
        .join(repo_name)
}

fn commit_files_in_repo(owner: &str, repo_name: &str, files: &[CommitFileRequest], message: &str) -> Result<String, String> {
    let bare_repo = git::get_repo_path(owner, repo_name);
    if !bare_repo.exists() {
        return Err("Repository does not exist".to_string());
    }

    let worktree = repo_worktree_path(owner, repo_name);

    if !worktree.exists() {
        fs::create_dir_all(&worktree).map_err(|e| format!("Could not create worktree: {e}"))?;

        let clone_status = Command::new("git")
            .args(["clone", bare_repo.to_str().unwrap(), worktree.to_str().unwrap()])
            .status()
            .map_err(|e| format!("Clone failed: {e}"))?;

        if !clone_status.success() {
            return Err("Failed to clone repository for commit".to_string());
        }
    }

    for file in files {
        let clean_path = file.path.trim().trim_start_matches('/');
        if clean_path.is_empty() {
            return Err("File path cannot be empty".to_string());
        }

        let full_path = worktree.join(clean_path);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Could not create directories for {clean_path}: {e}"))?;
        }

        fs::write(&full_path, &file.content)
            .map_err(|e| format!("Could not write file {clean_path}: {e}"))?;
    }

    let status = Command::new("git")
        .current_dir(&worktree)
        .args(["add", "."])
        .status()
        .map_err(|e| format!("git add failed: {e}"))?;

    if !status.success() {
        return Err("git add failed".to_string());
    }

    let commit_message = if message.trim().is_empty() {
        "codegen commit".to_string()
    } else {
        message.trim().to_string()
    };

    let commit_status = Command::new("git")
        .current_dir(&worktree)
        .args([
            "-c",
            "user.name=Codegen",
            "-c",
            "user.email=codegen@local",
            "commit",
            "-m",
            &commit_message,
        ])
        .status()
        .map_err(|e| format!("git commit failed: {e}"))?;

    if !commit_status.success() {
        return Err("No changes to commit or git commit failed".to_string());
    }

    let rev_parse = Command::new("git")
        .current_dir(&worktree)
        .args(["rev-parse", "HEAD"])
        .output()
        .map_err(|e| format!("Could not read commit hash: {e}"))?;

    if !rev_parse.status.success() {
        return Err("Could not read commit hash".to_string());
    }

    let hash = String::from_utf8_lossy(&rev_parse.stdout).trim().to_string();
    Ok(hash)
}

async fn create_commit(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CommitRequest>,
) -> impl IntoResponse {
    let user = match get_authenticated_user(&headers, &state).await {
        Ok(user) => user,
        Err((status, json)) => return (status, json),
    };

    let repo_name = payload.repo_name.trim();
    if repo_name.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "message": "Repository name is required" })));
    }

    let repo_exists = query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE owner = ? AND name = ?"
    )
    .bind(&user.username)
    .bind(repo_name)
    .fetch_optional(&state.db)
    .await;

    if repo_exists.is_err() || repo_exists.unwrap().is_none() {
        return (StatusCode::NOT_FOUND, Json(json!({ "message": "Repository not found" })));
    }

    if payload.files.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "message": "At least one file is required for a commit" })));
    }

    match commit_files_in_repo(&user.username, repo_name, &payload.files, &payload.message) {
        Ok(hash) => (
            StatusCode::OK,
            Json(json!({
                "success": true,
                "message": "Repository updated successfully",
                "commit": hash,
                "repo": repo_name,
                "owner": user.username
            }))
        ),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "message": err
            }))
        ),
    }
}

    let worktree = repo_worktree_path(owner, repo_name);
    if !worktree.exists() {
        fs::create_dir_all(&worktree).map_err(|e| format!("Could not create worktree: {e}"))?;
        let clone_status = Command::new("git")
            .args(["clone", bare_repo.to_str().unwrap(), worktree.to_str().unwrap()])
            .status()
            .map_err(|e| format!("Clone failed: {e}"))?;

        if !clone_status.success() {
            return Err("Failed to clone repository for commit".to_string());
        }
    }

    if !worktree.join(".git").exists() {
        fs::create_dir_all(&worktree).map_err(|e| format!("Could not prepare repo: {e}"))?;
    }

    for file in files {
        let clean_path = file.path.trim().trim_start_matches('/');
        if clean_path.is_empty() {
            return Err("File path cannot be empty".to_string());
        }
        let full_path = worktree.join(clean_path);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Could not create directories for {clean_path}: {e}"))?;
        }
        fs::write(&full_path, &file.content).map_err(|e| format!("Could not write file {clean_path}: {e}"))?;
    }

    let status = Command::new("git")
        .current_dir(&worktree)
        .args(["add", "."])
        .status()
        .map_err(|e| format!("git add failed: {e}"))?;

    if !status.success() {
        return Err("git add failed".to_string());
    }

    let commit_message = if message.trim().is_empty() {
        "codegen commit".to_string()
    } else {
        message.trim().to_string()
    };

    let commit_status = Command::new("git")
        .current_dir(&worktree)
        .args(["-c", "user.name=Codegen", "-c", "user.email=codegen@local", "commit", "-m", &commit_message])
        .status()
        .map_err(|e| format!("git commit failed: {e}"))?;

    if !commit_status.success() {
        return Err("No changes to commit or git commit failed".to_string());
    }

    let rev_parse = Command::new("git")
        .current_dir(&worktree)
        .args(["rev-parse", "HEAD"])
        .output()
        .map_err(|e| format!("Could not read commit hash: {e}"))?;

    if !rev_parse.status.success() {
        return Err("Could not read commit hash".to_string());
    }

    let hash = String::from_utf8_lossy(&rev_parse.stdout).trim().to_string();

    let push_status = Command::new("git")
        .current_dir(&worktree)
        .args(["push", "origin", "HEAD:main"])
        .status();

    match push_status {
        Ok(status) if status.success() => {}
        Ok(_) => {}
        Err(_) => {}
    }

    Ok(hash)
}

async fn create_commit(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CommitRequest>,
) -> impl IntoResponse {
    let user = match get_authenticated_user(&headers, &state).await {
        Ok(user) => user,
        Err((status, json)) => return (status, json),
    };

    let repo_name = payload.repo_name.trim();
    if repo_name.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({"message": "Repository name is required"})));
    }

    let repo_exists = query_as::<_, RepoRow>(
        "SELECT id, owner, name, description, created_at FROM repositories WHERE owner = ? AND name = ?"
    )
    .bind(&user.username)
    .bind(repo_name)
    .fetch_optional(&state.db)
    .await;

    if repo_exists.is_err() || repo_exists.unwrap().is_none() {
        return (StatusCode::NOT_FOUND, Json(json!({"message": "Repository not found"})));
    }

    if payload.files.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({"message": "At least one file is required for a commit"})));
    }

    match commit_files_in_repo(&user.username, repo_name, &payload.files, &payload.message) {
        Ok(hash) => (
            StatusCode::OK,
            Json(json!({
                "success": true,
                "message": "Repository updated successfully",
                "commit": hash,
                "repo": repo_name,
                "owner": user.username
            })),
        ),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "message": err
            })),
        ),
    }
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
    if !git::repo_exists(&owner, repo_name) {
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

    let db = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(10)
        .connect("sqlite:codegen.db")
        .await
        .expect("failed to connect to sqlite db");

    let state = AppState { db: db.clone() };
    ensure_db(&state).await;

    let app = Router::new()
        .route("/", get(homepage))
        .route("/create", get(create_page).post(handle_create))
        .route("/:owner/:repo", get(repo_page))
        .route("/:owner/:repo/info/refs", get(git::protocol::handle_info_refs))
        .route("/:owner/:repo/:service", post(git::protocol::handle_service))
        .route("/api/auth/register", post(register_user))
        .route("/api/auth/login", post(login_user))
        .route("/api/auth/user", get(get_current_user))
        .route("/api/repositories", get(list_repositories).post(create_repository))
        .route("/api/repositories/:id", delete(delete_repository))
        .route("/api/repos", get(list_repositories).post(create_repository))
        .route("/api/repos/:id", delete(delete_repository))
        .route("/api/repos/commit", post(create_commit))
        .route("/api/repository/commit", post(create_commit))
        .with_state(state);

    println!("🚀 BlueBix Codegen (Rust) running.");

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
