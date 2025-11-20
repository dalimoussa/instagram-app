Important notice about committing .env files

Including .env files with real secrets in a public GitHub repository is risky.
If you commit secrets and push them to GitHub, consider them compromised and rotate API keys and passwords immediately.

If you insist on including .env files in the repo, follow these steps (PowerShell):

1. Force add the .env file despite .gitignore:
   git add -f .env
2. Commit:
   git commit -m "Add .env (INSECURE - user acknowledged risk)"
3. Push:
   git push

If the repo is public and you accidentally pushed secrets, remove them from history and rotate credentials.
Refer to: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
