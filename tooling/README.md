# Shared workspace development launcher

`workspace-root/` versions the files that live outside the two separate Git
repositories. The checked-in package runs Expo and the API with `npm run dev:all`.

After cloning `GoMate-FE` and `GoMate-BE` side by side, copy the contents of
`GoMate-FE/tooling/workspace-root/` into their shared parent directory. Review any
existing root files before replacing them. Then run `npm install` in that parent
directory and follow its README. Install dependencies in both child projects too.

Do not run the launcher directly inside this template folder: its relative paths
assume the shared parent containing `GoMate-FE` and `GoMate-BE`.

The existing workspace root remains ready to use. Runtime environment files and
installed dependencies are not included in Git.
