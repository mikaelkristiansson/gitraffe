use std::process::Command;

use chrono::Utc;
use serde::Serialize;
use std::io::Write;
use std::process::Stdio;
use tauri::Error;

#[derive(Debug, Serialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BaseBranch {
    pub branch_name: String,
    pub remote_url: String,
    pub behind: usize,
    pub ahead: usize,
    pub last_fetched: String,
}

#[tauri::command(async)]
pub async fn git_status(path: String) -> String {
    let status = Command::new("git")
        .arg("status")
        .current_dir(path)
        .output()
        .unwrap();
    String::from_utf8_lossy(&status.stdout).to_string()
}

#[tauri::command(async)]
pub async fn git_default_branch(path: String) -> Result<BaseBranch, Error> {
    let current_dir = path.clone();
    let now = Utc::now();
    let name = Command::new("git")
        .args(["symbolic-ref", "refs/remotes/origin/HEAD", "--short"])
        .current_dir(&current_dir)
        .output()
        .unwrap();
    let branch_name = String::from_utf8_lossy(&name.stdout)
        .to_string()
        .trim_end()
        .to_owned();

    let remote = Command::new("git")
        .args(["remote", "get-url", "origin"])
        .current_dir(&current_dir)
        .output()
        .unwrap();
    let diff = branch_name.to_owned() + "..." + &branch_name.replace("origin/", "");

    let ahead_behind = Command::new("git")
        .args(["rev-list", "--left-right", "--count", &diff])
        .current_dir(&current_dir)
        .output()
        .unwrap();
    let binding = String::from_utf8_lossy(&ahead_behind.stdout).to_string();
    let mut iter = binding.split_whitespace();
    let behind = iter.next().unwrap().parse::<usize>().unwrap();
    let ahead = iter.next().unwrap().parse::<usize>().unwrap();

    let base = BaseBranch {
        branch_name,
        remote_url: String::from_utf8_lossy(&remote.stdout)
            .to_string()
            .trim_end()
            .to_owned(),
        behind,
        ahead,
        last_fetched: now.to_string(),
    };
    Ok(base)
}

#[tauri::command(async)]
pub async fn git_branches(path: String) -> Result<Vec<String>, Error> {
    let branches = Command::new("git")
        .args(["branch", "-v"]) //"--all"
        .current_dir(path)
        .output()
        .unwrap();
    let branches = String::from_utf8_lossy(&branches.stdout)
        .to_string()
        .split("\n")
        .map(|s| s.trim().to_string())
        .collect();
    Ok(branches)
}

#[tauri::command(async)]
pub async fn git_checkout(path: String, branch: String) -> Result<String, Error> {
    let checkout = Command::new("git")
        .args(["checkout", &branch])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&checkout.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_pull(path: String) -> Result<String, Error> {
    let pull = Command::new("git")
        .args(["pull"])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&pull.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_pull_origin(path: String, branch: String) -> Result<String, Error> {
    let pull = Command::new("git")
        .args(["pull", "origin", &branch])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&pull.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_push(path: String) -> Result<String, Error> {
    let push = Command::new("git")
        .args(["push"])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&push.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_fetch(path: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args(["fetch"])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_get_changes(path: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args([
            "--no-optional-locks",
            "status",
            "--untracked-files=all",
            "--branch",
            "--porcelain=2",
            "-z",
        ])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_diff(path: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args(["diff", "--check"])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_diff_ref(path: String, reference: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args(["diff", "--numstat", "-z", &reference])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_reset_all(path: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args(["reset", "--", "."])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git_commit(path: String, message: String) -> Result<String, Error> {
    let fetch = Command::new("git")
        .args(["commit", "-F", "-", "-m", &message])
        .current_dir(path)
        .output()
        .unwrap();
    Ok(String::from_utf8_lossy(&fetch.stdout).to_string())
}

#[tauri::command(async)]
pub async fn git(path: String, args: Vec<String>, stdin: Option<String>) -> Result<String, Error> {
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

    Ok(stdout)
}
