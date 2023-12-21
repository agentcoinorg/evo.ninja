import { InMemoryWorkspace } from "../sys";

describe('InMemoryWorkspace', () => {
  test('write file, read file, read directory', async () => {
    const workspace = new InMemoryWorkspace();
    const file = "file.txt";
    const data = "foo";
    const entries = [{
      name: file,
      type: "file"
    }];
    workspace.writeFileSync(file, data);
    expect(workspace.readFileSync(file)).toEqual(data);
    expect(workspace.readdirSync("./")).toEqual(entries);
    expect(workspace.readdirSync("/")).toEqual(entries);
    expect(workspace.readdirSync("")).toEqual(entries);
  });
});
