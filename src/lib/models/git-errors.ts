/** The git errors which can be parsed from failed git commands. */
export enum IGitError {
	BadConfigValue = 0,
	SSHKeyAuditUnverified = 1,
	SSHAuthenticationFailed = 2,
	SSHPermissionDenied = 3,
	HTTPSAuthenticationFailed = 4,
	RemoteDisconnection = 5,
	HostDown = 6,
	RebaseConflicts = 7,
	MergeConflicts = 8,
	HTTPSRepositoryNotFound = 9,
	SSHRepositoryNotFound = 10,
	PushNotFastForward = 11,
	BranchDeletionFailed = 12,
	DefaultBranchDeletionFailed = 13,
	RevertConflicts = 14,
	EmptyRebasePatch = 15,
	NoMatchingRemoteBranch = 16,
	NoExistingRemoteBranch = 17,
	NothingToCommit = 18,
	NoSubmoduleMapping = 19,
	SubmoduleRepositoryDoesNotExist = 20,
	InvalidSubmoduleSHA = 21,
	LocalPermissionDenied = 22,
	InvalidMerge = 23,
	InvalidRebase = 24,
	NonFastForwardMergeIntoEmptyHead = 25,
	PatchDoesNotApply = 26,
	BranchAlreadyExists = 27,
	BadRevision = 28,
	NotAGitRepository = 29,
	CannotMergeUnrelatedHistories = 30,
	LFSAttributeDoesNotMatch = 31,
	BranchRenameFailed = 32,
	PathDoesNotExist = 33,
	InvalidObjectName = 34,
	OutsideRepository = 35,
	LockFileAlreadyExists = 36,
	NoMergeToAbort = 37,
	LocalChangesOverwritten = 38,
	UnresolvedConflicts = 39,
	GPGFailedToSignData = 40,
	ConflictModifyDeletedInBranch = 41,
	PushWithFileSizeExceedingLimit = 42,
	HexBranchNameRejected = 43,
	ForcePushRejected = 44,
	InvalidRefLength = 45,
	ProtectedBranchRequiresReview = 46,
	ProtectedBranchForcePush = 47,
	ProtectedBranchDeleteRejected = 48,
	ProtectedBranchRequiredStatus = 49,
	PushWithPrivateEmail = 50,
	ConfigLockFileAlreadyExists = 51,
	RemoteAlreadyExists = 52,
	TagAlreadyExists = 53,
	MergeWithLocalChanges = 54,
	RebaseWithLocalChanges = 55,
	MergeCommitNoMainlineOption = 56,
	UnsafeDirectory = 57,
	PathExistsButNotInRef = 58
}
/** A mapping from regexes to the git error they identify. */
export const GitErrorRegexes: {
	[regexp: string]: IGitError;
} = {
	"fatal: bad (?:numeric|boolean) config value '(.+)' for '(.+)'": IGitError.BadConfigValue,
	'ERROR: ([\\s\\S]+?)\\n+\\[EPOLICYKEYAGE\\]\\n+fatal: Could not read from remote repository.':
		IGitError.SSHKeyAuditUnverified,
	"fatal: Authentication failed for 'https://": IGitError.HTTPSAuthenticationFailed,
	'fatal: Authentication failed': IGitError.SSHAuthenticationFailed,
	'fatal: Could not read from remote repository.': IGitError.SSHPermissionDenied,
	'The requested URL returned error: 403': IGitError.HTTPSAuthenticationFailed,
	'fatal: [Tt]he remote end hung up unexpectedly': IGitError.RemoteDisconnection,
	"fatal: unable to access '(.+)': Failed to connect to (.+): Host is down": IGitError.HostDown,
	"Cloning into '(.+)'...\nfatal: unable to access '(.+)': Could not resolve host: (.+)":
		IGitError.HostDown,
	'Resolve all conflicts manually, mark them as resolved with': IGitError.RebaseConflicts,
	'(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)':
		IGitError.MergeConflicts,
	"fatal: repository '(.+)' not found": IGitError.HTTPSRepositoryNotFound,
	'ERROR: Repository not found': IGitError.SSHRepositoryNotFound,
	"\\((non-fast-forward|fetch first)\\)\nerror: failed to push some refs to '.*'":
		IGitError.PushNotFastForward,
	"error: unable to delete '(.+)': remote ref does not exist": IGitError.BranchDeletionFailed,
	'\\[remote rejected\\] (.+) \\(deletion of the current branch prohibited\\)':
		IGitError.DefaultBranchDeletionFailed,
	"error: could not revert .*\nhint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'":
		IGitError.RevertConflicts,
	"Applying: .*\nNo changes - did you forget to use 'git add'\\?\nIf there is nothing left to stage, chances are that something else\n.*":
		IGitError.EmptyRebasePatch,
	'There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end.':
		IGitError.NoMatchingRemoteBranch,
	"Your configuration specifies to merge with the ref '(.+)'\nfrom the remote, but no such ref was fetched.":
		IGitError.NoExistingRemoteBranch,
	'nothing to commit': IGitError.NothingToCommit,
	"[Nn]o submodule mapping found in .gitmodules for path '(.+)'": IGitError.NoSubmoduleMapping,
	"fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed":
		IGitError.SubmoduleRepositoryDoesNotExist,
	"Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed.":
		IGitError.InvalidSubmoduleSHA,
	"fatal: could not create work tree dir '(.+)'.*: Permission denied":
		IGitError.LocalPermissionDenied,
	'merge: (.+) - not something we can merge': IGitError.InvalidMerge,
	'invalid upstream (.+)': IGitError.InvalidRebase,
	'fatal: Non-fast-forward commit does not make sense into an empty head':
		IGitError.NonFastForwardMergeIntoEmptyHead,
	'error: (.+): (patch does not apply|already exists in working directory)':
		IGitError.PatchDoesNotApply,
	"fatal: [Aa] branch named '(.+)' already exists.?": IGitError.BranchAlreadyExists,
	"fatal: bad revision '(.*)'": IGitError.BadRevision,
	'fatal: [Nn]ot a git repository \\(or any of the parent directories\\): (.*)':
		IGitError.NotAGitRepository,
	'fatal: refusing to merge unrelated histories': IGitError.CannotMergeUnrelatedHistories,
	'The .+ attribute should be .+ but is .+': IGitError.LFSAttributeDoesNotMatch,
	'fatal: Branch rename failed': IGitError.BranchRenameFailed,
	"fatal: path '(.+)' does not exist .+": IGitError.PathDoesNotExist,
	"fatal: invalid object name '(.+)'.": IGitError.InvalidObjectName,
	"fatal: .+: '(.+)' is outside repository": IGitError.OutsideRepository,
	'Another git process seems to be running in this repository, e.g.':
		IGitError.LockFileAlreadyExists,
	'fatal: There is no merge to abort': IGitError.NoMergeToAbort,
	'error: (?:Your local changes to the following|The following untracked working tree) files would be overwritten by checkout:':
		IGitError.LocalChangesOverwritten,
	'You must edit all merge conflicts and then\nmark them as resolved using git add|fatal: Exiting because of an unresolved conflict':
		IGitError.UnresolvedConflicts,
	'error: gpg failed to sign the data': IGitError.GPGFailedToSignData,
	'CONFLICT \\(modify/delete\\): (.+) deleted in (.+) and modified in (.+)':
		IGitError.ConflictModifyDeletedInBranch,
	// GitHub-specific errors
	'error: GH001: ': IGitError.PushWithFileSizeExceedingLimit,
	'error: GH002: ': IGitError.HexBranchNameRejected,
	'error: GH003: Sorry, force-pushing to (.+) is not allowed.': IGitError.ForcePushRejected,
	'error: GH005: Sorry, refs longer than (.+) bytes are not allowed': IGitError.InvalidRefLength,
	'error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required':
		IGitError.ProtectedBranchRequiresReview,
	'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch':
		IGitError.ProtectedBranchForcePush,
	'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch':
		IGitError.ProtectedBranchDeleteRejected,
	'error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected':
		IGitError.ProtectedBranchRequiredStatus,
	'error: GH007: Your push would publish a private email address.': IGitError.PushWithPrivateEmail,
	'error: could not lock config file (.+): File exists': IGitError.ConfigLockFileAlreadyExists,
	'error: remote (.+) already exists.': IGitError.RemoteAlreadyExists,
	"fatal: tag '(.+)' already exists": IGitError.TagAlreadyExists,
	'error: Your local changes to the following files would be overwritten by merge:\n':
		IGitError.MergeWithLocalChanges,
	'error: cannot (pull with rebase|rebase): You have unstaged changes\\.\n\\s*error: [Pp]lease commit or stash them\\.':
		IGitError.RebaseWithLocalChanges,
	'error: commit (.+) is a merge but no -m option was given': IGitError.MergeCommitNoMainlineOption,
	'fatal: detected dubious ownership in repository at (.+)': IGitError.UnsafeDirectory,
	"fatal: path '(.+)' exists on disk, but not in '(.+)'": IGitError.PathExistsButNotInRef
};
/**
 * The error code for when git cannot be found. This most likely indicates a
 * problem with dugite itself.
 */
export const GitNotFoundErrorCode = 'git-not-found-error';
/** The error code for when the path to a repository doesn't exist. */
export const RepositoryDoesNotExistErrorCode = 'repository-does-not-exist-error';
