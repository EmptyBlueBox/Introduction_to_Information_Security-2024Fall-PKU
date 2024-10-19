
/**
 * Inserts the given HTML content into the extra content cell of the standard
 * title bar.
 *
 * @param content The HTML content to place
 */
function insertTitlebarContent(content) {
  var contentCell = document.getElementById("_titlebarExtraContent");
  contentCell.innerHTML = content;
}
