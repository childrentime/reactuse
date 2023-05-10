# prebuild for netlify
cd ../core
pnpm run build
pnpm -w run build:types
