[日本語](README.md) | [English](README.en.md)

# Lewis Carroll's Logic Game

This project makes the game described in Lewis Carroll's *Symbolic Logic*
available to play in a web browser.

The application was developed primarily with reference to the following work:

Lewis Carroll, *Symbolic Logic, Part I: Elementary*, 4th ed., Macmillan, 1897.

It includes a feature for answering conclusions in quiz form and a feature
that allows users to create their own problems. The application supports both
Japanese and English.

## Modes

### Problems

- **Built-in problems**: Use two predefined premises.
- **Custom problems**: Allow users to enter two premises. Terms registered by
  the user can also be used.

### Diagrams

- **Automatic display**: Automatically displays the diagrams for the premises
  and conclusion.
- **Manual counter placement**: Allows users to place counters inside cells or
  on boundaries. Users can proceed when both the logical position and the type
  of counter are correct.

### Conclusion

- **Automatic display**: Automatically displays the conclusion derived from
  the combined premises.
- **Quiz**: Asks users to answer which conclusion follows from the premises.
  After answering correctly, they can proceed to the conclusion diagram.

## Saving, Exporting, and Importing Data

Multiple custom problems can be given names and saved in the browser.

The list of user-registered terms is also saved in the browser.

User-registered terms and saved custom problems can be exported to a JSON
file.

To export or import a backup, click the **Save Backup** or **Restore Backup**
button near the bottom of `index.html`.

## Tutorial

`tutorial.html` explains the notation and counter-movement rules used in
Lewis Carroll's logic game.

## Requirements

Regular use only requires a current web browser. Node.js and npm are not
required.

Building, testing, or developing from source requires Node.js and npm.

- Node.js 24 LTS is recommended
- Node.js 22.12.0 or newer is required
- npm

The application has been tested with Google Chrome.

## Running the Game

### For Regular Users

Download the distribution ZIP file from the GitHub **Releases** page and
extract it.

Double-click `index.html` in the extracted folder to start the game. To view
the instructions, double-click `tutorial.html`.

No development environment or command-line operations are required.

### Building from Source

The source code downloaded from GitHub's **Code** menu does not include the
built `dist` folder.

Run the following commands to generate the distribution files:

```sh
node -v
npm ci
npm run build
```
After the build is complete, open dist/index.html.

## Setup and Development

```sh
node -v
npm ci
npm run dev
```

If `node -v` reports a version older than 22.12.0, it is not supported for
this project's development environment. If you use nvm, run `nvm use` in the
repository root to select the Node.js 24 line from `.nvmrc`.

The development URL is displayed in the console. TypeScript changes are
watched automatically, but changes to HTML or CSS may require restarting the
development command.

### Verification

```sh
node -v
npm ci
npm test
npm run typecheck
npm run build
npm run check
```

npm run check runs type checking, tests, and the build in sequence.

### Distribution

Running npm run build generates the distribution files in dist/.

The generated dist/index.html and dist/tutorial.html files can be opened
directly in a browser. No external network connection or local server is
required.

## Author

Yuki Nishimuta

## License

This project is released under the MIT License.
