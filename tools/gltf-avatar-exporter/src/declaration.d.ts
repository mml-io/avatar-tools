// For CSS
declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.svg" {
  const filePath: string;
  export default filePath;
}

declare module "*.png" {
  const filePath: string;
  export default filePath;
}

declare module "*.jpg" {
  const filePath: string;
  export default filePath;
}

declare module "*.glb" {
  const filePath: string;
  export default filePath;
}

declare module "*.hdr" {
  const filePath: string;
  export default filePath;
}
