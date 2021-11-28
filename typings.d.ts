declare module "minecraft-server-properties" {
  export function parse(
    input: string
  ): { [key: string]: string | boolean | number };
  export function stringify(input: {
    [key: string]: string | boolean | number;
  }): string;
}
