import { join } from "path";
import fs from "fs";

export class MinecraftServerFiles {
  private _path: string;

  constructor(path: string) {
    this._path = path;
  }

  /**
   * Lists files and folders in a path
   *
   * @param {string} [path] Relative path of the directory to scan, defaults to server folder
   * @return {string[]} List of files and directories
   * @memberof MinecraftServerFiles
   */
  list(path?: string): string[] {
    return fs.readdirSync(join(this._path, path || ""));
  }

  /**
   * Reads a file from the server folder
   *
   * @param {string} path Relative path to the file
   * @return {(string | Buffer)}
   * @memberof MinecraftServerFiles
   */
  read(path: string): string | Buffer {
    return fs.readFileSync(join(this._path, path));
  }

  /**
   * Writes data to a file in the server folder
   *
   * @param {string} path Relative path to the file
   * @param {(string | NodeJS.ArrayBufferView)} data Data to write
   * @memberof MinecraftServerFiles
   */
  write(path: string, data: string | NodeJS.ArrayBufferView) {
    fs.writeFileSync(join(this._path, path), data);
  }

  /**
   * Removes a file/folder from the server folder
   *
   * @param {string} path Relative path to the target file/folder
   * @return {void}
   * @memberof MinecraftServerFiles
   */
  remove(path: string): void {
    fs.rmSync(join(this._path, path), { recursive: true, force: true });
  }

  get path(): string {
    return this._path;
  }
}
