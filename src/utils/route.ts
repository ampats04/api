import { routes } from "../routes";

/**
 * Get the route pattern from the path
 * @param path What path to check
 */
export function getPattern(requestPath: string) {
  // index of ?
  const i = requestPath.indexOf('?');

  // If has a question mark (?)
  if (i >= 0) {
    // Get the path
    requestPath = requestPath.slice(0, i);
  }

  // Path pattern
  const patterns = requestPath.slice(1).split("/");

  // For each route
  for (const route of routes) {
    // If the path is equal to the route path
    if (requestPath === route.path) {
      // Return true
      return requestPath;
    }

    // if contains a colon (:)
    if (route.path.includes(':')) {
      // Request path pattern
      const requestPatterns = route.path.slice(1).split("/");

      // Patterns should be e.g [ 'students , 5 ]
      // Request patterns should be e.g. [ 'students', ':id' ]
      
      // If the length of the patterns are not equal, continue
      if (patterns.length !== requestPatterns.length) {
        continue;
      }

      // Is same flag
      let isSame = true;

      // For each pattern
      for (let i = 0; i < patterns.length; i++) {
        // If the pattern is not equal to the request pattern and the request pattern does not start with a colon (:)
        if (!requestPatterns[i].startsWith(':') && patterns[i] !== requestPatterns[i]) {
          // Set isSame to false
          isSame = false;
          break;
        }
      }

      // If not same, continue
      if (!isSame) {
        continue;
      }
      
      // For each pattern except the first one
      for (let i = 1; i < patterns.length; i++) {
        // If the pattern is not equal to the request pattern
        if (patterns[i] !== requestPatterns[i] && !requestPatterns[i].includes(':')) {
          // Return null
          return null;
        }
      }

      // If the code reached this point, it means that they are matched!
      return route.path;
    }
  }

  // Otherwise, false
  return null;
}

/**
 * Get the main route name
 * @param path 
 * @returns 
 */
export function getMainRoute(path: string): string {
  // Get the index of the second slash
  const i = path.indexOf("/", 1);
  // Return the main route name
  return path.slice(0, i === -1 ? path.length : i);
}