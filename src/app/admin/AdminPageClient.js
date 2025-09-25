// This file is a tiny JS proxy so dynamic imports from TSX can resolve at runtime
// It re-exports the default export from the TSX module.
import mod from './AdminPageClient';
export default mod;
