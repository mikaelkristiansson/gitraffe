use serde::Serialize;
use std::io::Write;
use std::process::Command;
use std::process::Stdio;
use tauri::Error;

#[derive(Debug, Serialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitResponse {
    pub stdout: String,
    pub stderr: String,
    pub status: i32,
}

#[tauri::command(async)]
pub async fn git(
    path: String,
    args: Vec<String>,
    stdin: Option<String>,
) -> Result<GitResponse, Error> {
    let mut child = Command::new("git")
        .args(&args)
        .current_dir(path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    if let Some(stdin) = stdin {
        let child_stdin = child.stdin.as_mut().unwrap();
        child_stdin.write_all(stdin.as_bytes()).unwrap();
    }

    let output = child.wait_with_output().unwrap();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let status = output.status.code().unwrap();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let response = GitResponse {
        stdout,
        stderr,
        status,
    };

    Ok(response)
}
