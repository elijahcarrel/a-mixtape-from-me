// Declare SCSS modules as valid module imports.
declare module '*.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
