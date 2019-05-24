export abstract class Strings {
  static isEmpty(str: string): boolean {
    return str.trim().length === 0;
  }
}
