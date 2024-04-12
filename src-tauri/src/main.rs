// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub(crate) mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::git_push,
            commands::git_diff,
            commands::git_diff_ref,
            commands::git_commit,
            commands::git_reset_all,
            commands::git
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
