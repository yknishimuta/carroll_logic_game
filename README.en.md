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

Only a web browser is required to use the game. Node.js and npm are required
for development.

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
npm ci
npm run build
```
After the build is complete, open dist/index.html.

## Setup and Development

```sh
npm install
npm run dev
```

The development URL is displayed in the console. TypeScript changes are
watched automatically, but changes to HTML or CSS may require restarting the
development command.

### Verification

```sh
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