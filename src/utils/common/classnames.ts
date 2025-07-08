type ClassValue = string | number | null | boolean | undefined;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

export function classNames(
  ...args: (ClassValue | ClassDictionary | ClassArray)[]
): string {
  const classes = [];
  for (const arg of args) {
    if (arg) {
      if (Array.isArray(arg)) {
        classes.push(...arg);
      } else if (typeof arg === 'string') {
        classes.push(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        for (const key in arg) {
          if (arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }
  return classes.filter(Boolean).join(' ');
}
