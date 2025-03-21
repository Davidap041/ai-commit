export const commitMessageTemplate = `
Write a professional git commit message based on the template below
using language{language}, return the full setence without formatting

always use commit types with emoji and their meanings
always use  the scope
:
- feat (✨): New feature (MINOR version)
- fix (🐛): Bug fix (PATCH version)
- docs (📚): Documentation changes
- style (🎨): Code style/formatting
- refactor (♻️): Code refactoring
- build (🔧): Build system/dependencies
- test (✅): Testing changes
- chore (🔨): Maintenance tasks

Follow this commit message template structure:

<emoji> <type>(<scope>): <short description>

- <Bullet point describing each significant change>


Please analyze the following diff and generate a commit message that follows these conventions:

{diff}
`;