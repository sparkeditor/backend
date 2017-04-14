/**
 * Some helper functions to translate Ace data into Spark data
 */
module.exports = {
  strFromLines: function(lines) {
    return lines.join("\n");
  },
  offsetFromCoordinates: function(coords, pieceTable) {
    const row = coords.row;
    const column = coords.column;
    let currentRow = 0;
    let currentCol = 0;
    let i = 0;
    for (let c of pieceTable) {
      if (currentCol === column && currentRow === row) {
        return i;
      }
      if (c === "\n") {
        currentRow++;
        currentCol = 0;
      } else {
        currentCol++;
      }
      i++;
    }
    return i;
  },
  lengthFromCoordinates: function(start, end, pieceTable) {
    const startRow = start.row;
    const startColumn = start.column;
    const endRow = end.row;
    const endColumn = end.column;
    let currentRow = 0;
    let currentCol = 0;
    let counting = false;
    let startOffset;
    let length = 0;
    let i = 0;
    for (let c of pieceTable) {
      if (counting) {
        length++;
      }
      if (currentCol === startColumn && currentRow === startRow) {
        startOffset = i;
        counting = true;
      }
      if (currentCol === endColumn && currentRow === endRow) {
        return length;
      }
      if (c === "\n") {
        currentRow++;
        currentCol = 0;
      } else {
        currentCol++;
      }
      i++;
    }
    return length;
  }
};
