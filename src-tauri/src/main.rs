// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub(crate) mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::git_status,
            commands::git_default_branch,
            commands::git_branches,
            commands::git_fetch,
            commands::git_pull,
            commands::git_pull_origin,
            commands::git_push,
            commands::git_checkout,
            commands::git_get_changes,
            commands::git_diff,
            commands::git_diff_ref,
            commands::git_commit,
            commands::git_reset_all,
            commands::git
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
