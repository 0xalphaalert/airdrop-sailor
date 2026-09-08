// ============================================================================
// AIRDROPSAILOR STUDIO - DYNAMIC REGISTRY
// Automatically discovers and maps all templates using Vite's glob import
// ============================================================================

// 1. Tell Vite to instantly scan the templates folder and grab every .jsx file
const modules = import.meta.glob('../templates/**/*.jsx', { eager: true });

// 2. Build the dictionary object
export const DYNAMIC_REGISTRY = {};

for (const path in modules) {
  // Extract the folder and filename from the path
  // Example: "../templates/SingleFundingAlert/SingleFndAlertV1.jsx" 
  // Becomes: "SingleFundingAlert/SingleFndAlertV1"
  const match = path.match(/\.\.\/templates\/(.+)\.jsx$/);
  
  if (match) {
    const componentPath = match[1];
    
    // Ensure the file actually exports a default React component
    if (modules[path].default) {
      DYNAMIC_REGISTRY[componentPath] = modules[path].default;
    } else {
      console.warn(`Creator Studio Warning: No default export found in ${path}`);
    }
  }
}