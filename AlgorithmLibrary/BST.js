// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco

// Constants.

BST.LINK_COLOR = "#007700"
BST.HIGHLIGHT_CIRCLE_COLOR = "#007700"
BST.FOREGROUND_COLOR = "#007700"
BST.BACKGROUND_COLOR = "#EEFFEE"
BST.PRINT_COLOR = BST.FOREGROUND_COLOR

BST.WIDTH_DELTA = 50
BST.HEIGHT_DELTA = 50
BST.STARTING_Y = 50
BST.BUILD_DELTA_Y = 100

BST.FIRST_PRINT_POS_X = 50
BST.PRINT_VERTICAL_GAP = 20
BST.PRINT_HORIZONTAL_GAP = 50

function BST(am, w, h) {
  this.init(am, w, h)
}

BST.prototype = new Algorithm()
BST.prototype.constructor = BST
BST.superclass = Algorithm.prototype

BST.prototype.init = function (am, w, h) {
  var sc = BST.superclass
  this.startingX = w / 2
  this.first_print_pos_y = h - 2 * BST.PRINT_VERTICAL_GAP
  this.print_max = w - 10

  var fn = sc.init
  fn.call(this, am)
  this.addControls()
  this.nextIndex = 0
  this.commands = []
  this.buildingTree = false
  this.cmd("CreateLabel", 0, "", 20, 10, 0)
  this.nextIndex = 1
  this.animationManager.StartNewAnimation(this.commands)
  this.animationManager.skipForward()
  this.animationManager.clearHistory()
}

BST.prototype.addControls = function () {
  this.insertField = addControlToAlgorithmBar("Text", "")
  this.insertField.onkeydown = this.returnSubmit(
    this.insertField,
    this.insertCallback.bind(this),
    4
  )
  this.insertButton = addControlToAlgorithmBar("Button", "Insert")
  this.insertButton.onclick = this.insertCallback.bind(this)
  this.deleteField = addControlToAlgorithmBar("Text", "")
  this.deleteField.onkeydown = this.returnSubmit(
    this.deleteField,
    this.deleteCallback.bind(this),
    4
  )
  this.deleteButton = addControlToAlgorithmBar("Button", "Delete")
  this.deleteButton.onclick = this.deleteCallback.bind(this)
  this.findField = addControlToAlgorithmBar("Text", "")
  this.findField.onkeydown = this.returnSubmit(
    this.findField,
    this.findCallback.bind(this),
    4
  )
  this.findButton = addControlToAlgorithmBar("Button", "Find")
  this.findButton.onclick = this.findCallback.bind(this)
  this.printButton = addControlToAlgorithmBar("Button", "Print")
  this.printButton.onclick = this.printCallback.bind(this)

  this.constructField = addControlToAlgorithmBar("Text", "1,2,3,4,5,6,7,8,9,10")
  this.constructButton = addControlToAlgorithmBar(
    "Button",
    "Construct from Sorted Input"
  )
  this.constructButton.onclick = this.constructTreeFromUI.bind(this)
}

BST.prototype.reset = function () {
  this.nextIndex = 1
  this.treeRoot = null
}

var ARRAY_BACKGROUND = "#FFFFFF"
var ARRAY_HIGHLIGHT = "#90EE90"

var ARRAY_Y = 80
var CELL_WIDTH = 30
var CELL_HEIGHT = 30
var ARROW_LENGTH = 30
const cells = []

BST.prototype.constructTreeFromUI = function () {
  const val = this.constructField.value.trim()
  if (!val) return

  let sorted = val
    .split(",")
    .map((n) => this.normalizeNumber(n, 4))
    .filter((n) => !isNaN(n)) // Ensure valid numbers

  sorted = [...new Set(sorted)] // Remove duplicates
  sorted.sort() // Sort numbers
  this.implementAction(this.buildTree.bind(this), sorted)
}

BST.prototype.drawArray = function (sorted) {
  this.arrayX = this.startingX - ((sorted.length - 1) / 2) * CELL_WIDTH
  for (let i = 0; i < sorted.length; i++) {
    let index = this.nextIndex++
    cells.push(index)
    this.cmd(
      "CreateRectangle",
      index,
      sorted[i],
      CELL_WIDTH,
      CELL_HEIGHT,
      this.arrayX + i * CELL_WIDTH,
      ARRAY_Y
    )
  }
}

BST.prototype.buildTree = function (sorted) {
  this.commands = []
  this.deleteTree(this.treeRoot)
  this.reset()

  this.buildingTree = true
  this.drawArray(sorted)

  const mid = Math.floor((sorted.length - 1) / 2)

  const treeNodeID = this.nextIndex++
  this.treeRoot = new BSTNode(
    sorted[mid],
    treeNodeID,
    this.startingX,
    BST.STARTING_Y + BST.BUILD_DELTA_Y
  )

  this.createNode(
    treeNodeID,
    this.treeRoot.data,
    this.startingX,
    BST.STARTING_Y + BST.BUILD_DELTA_Y
  )
  this.cmd("SetHighlight", treeNodeID, 1)
  this.cmd("SetText", 0, "Level: 0, Node: Root")
  this.cmd("Step")
  this.cmd("SetHighlight", treeNodeID, 0)

  this.buildTreeHelper(sorted, 0, sorted.length - 1, this.treeRoot, 0)

  for (let id of cells) {
    this.cmd("Delete", id)
  }
  cells.length = 0
  this.deleteArrows()

  this.cmd("SetText", 0, " ")

  this.buildingTree = false
  this.resizeTree();

  return this.commands
}

BST.prototype.setArrow = function (
  id, // left = 0, right = 1, mid = 2
  index // array index
) {
  let x = this.arrayX + index * CELL_WIDTH
  let bottom_y = ARRAY_Y - CELL_HEIGHT / 2
  this.cmd("MoveArrow", id, x, bottom_y - ARROW_LENGTH, x, bottom_y, id == 2? "#DD0000" : "#000000")
}

BST.prototype.deleteArrows = function () {
  this.cmd("DeleteArrow", 0)
  this.cmd("DeleteArrow", 1)
  this.cmd("DeleteArrow", 2)
}

BST.prototype.setRange = function (sorted, start, end, mid = -1) {
  this.deleteArrows()
  this.setArrow(0, start)
  this.setArrow(1, end)
  if (mid != -1){
    this.setArrow(2, mid);
  }
  for (let i = 0; i < sorted.length; i++) {
    this.cmd(
      "SetBackgroundColor",
      cells[i],
      start <= i && i <= end ? ARRAY_HIGHLIGHT : ARRAY_BACKGROUND
    )
  }
}

// Updates the array range above the node and highlight
BST.prototype.visualizeNode = function(
  sorted,
  start,
  end,
  mid, // -1 if not to be included
  node
) {
  this.highlightID = this.nextIndex++
  this.cmd(
    "CreateHighlightCircle",
    this.highlightID,
    this.HIGHLIGHT_CIRCLE_COLOR,
    node.x,
    node.y
  )
  this.setRange(sorted, start, end, mid)
  this.cmd("step")
  this.cmd("delete", this.highlightID)
}

BST.prototype.buildTreeHelper = function (sorted, start, end, node, level) {
  const mid = start + Math.floor((end - start) / 2)
  
  this.visualizeNode(sorted, start, end, mid, node)

  let justHighlighted = true

  if (start <= mid - 1) {
    const leftChild = this.createChildNode(
      sorted,
      start,
      mid - 1,
      node,
      level + 1,
      true
    )
    this.buildTreeHelper(sorted, start, mid - 1, leftChild, level + 1)
    justHighlighted = false
  }

  if (!justHighlighted){
    this.visualizeNode(sorted, start, end, mid, node)
  }

  justHighlighted = true

  if (mid + 1 <= end) {
    const rightChild = this.createChildNode(
      sorted,
      mid + 1,
      end,
      node,
      level + 1,
      false
    )
    this.buildTreeHelper(sorted, mid + 1, end, rightChild, level + 1)
    justHighlighted = false
  }

  if (!justHighlighted){
    this.visualizeNode(sorted, start, end, -1, node)
  }
}

BST.prototype.createChildNode = function (
  sorted,
  start,
  end,
  parentNode,
  level,
  isLeft
) {
  const mid = start + Math.floor((end - start) / 2)

  const treeNodeID = this.nextIndex++
  const childNode = new BSTNode(sorted[mid], treeNodeID, 100, 100)
  childNode.parent = parentNode
  if (isLeft) {
    parentNode.left = childNode
  } else {
    parentNode.right = childNode
  }

  this.createNode(treeNodeID, childNode.data, 30, BST.STARTING_Y)
  this.cmd("SetHighlight", childNode.graphicID, 1)
  this.cmd(
    "SetText",
    0,
    `Level: ${level}, Node: ${isLeft ? "Left" : "Right"} Child`
  )
  this.cmd("Step")
  this.cmd("SetHighlight", childNode.graphicID, 0)
  this.cmd("Connect", parentNode.graphicID, childNode.graphicID, BST.LINK_COLOR)
  this.resizeTree()

  return childNode
}

BST.prototype.createNode = function (id, value, startingX, startingY) {
  this.cmd("CreateCircle", id, value, startingX, startingY)
  this.cmd("SetForegroundColor", id, BST.FOREGROUND_COLOR)
  this.cmd("SetBackgroundColor", id, BST.BACKGROUND_COLOR)
}

BST.prototype.deleteTree = function (tree) {
  if (tree) {
    this.deleteTree(tree.left)
    this.deleteTree(tree.right)
    this.cmd("Delete", tree.graphicID)
  }
}

BST.prototype.insertCallback = function (event) {
  var insertedValue = this.insertField.value
  // Get text value
  insertedValue = this.normalizeNumber(insertedValue, 4)
  if (insertedValue != "") {
    // set text value
    this.insertField.value = ""
    this.implementAction(this.insertElement.bind(this), insertedValue)
  }
}

BST.prototype.deleteCallback = function (event) {
  var deletedValue = this.deleteField.value
  if (deletedValue != "") {
    deletedValue = this.normalizeNumber(deletedValue, 4)
    this.deleteField.value = ""
    this.implementAction(this.deleteElement.bind(this), deletedValue)
  }
}

BST.prototype.printCallback = function (event) {
  this.implementAction(this.printTree.bind(this), "")
}

BST.prototype.printTree = function (unused) {
  this.commands = []

  if (this.treeRoot != null) {
    this.highlightID = this.nextIndex++
    var firstLabel = this.nextIndex
    this.cmd(
      "CreateHighlightCircle",
      this.highlightID,
      BST.HIGHLIGHT_CIRCLE_COLOR,
      this.treeRoot.x,
      this.treeRoot.y
    )
    this.xPosOfNextLabel = BST.FIRST_PRINT_POS_X
    this.yPosOfNextLabel = this.first_print_pos_y
    this.printTreeRec(this.treeRoot)
    this.cmd("Delete", this.highlightID)
    this.cmd("Step")

    for (var i = firstLabel; i < this.nextIndex; i++) {
      this.cmd("Delete", i)
    }
    this.nextIndex = this.highlightID /// Reuse objects.  Not necessary.
  }
  return this.commands
}

BST.prototype.printTreeRec = function (tree) {
  this.cmd("Step")
  if (tree.left != null) {
    this.cmd("Move", this.highlightID, tree.left.x, tree.left.y)
    this.printTreeRec(tree.left)
    this.cmd("Move", this.highlightID, tree.x, tree.y)
    this.cmd("Step")
  }
  var nextLabelID = this.nextIndex++
  this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y)
  this.cmd("SetForegroundColor", nextLabelID, BST.PRINT_COLOR)
  this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel)
  this.cmd("Step")

  this.xPosOfNextLabel += BST.PRINT_HORIZONTAL_GAP
  if (this.xPosOfNextLabel > this.print_max) {
    this.xPosOfNextLabel = BST.FIRST_PRINT_POS_X
    this.yPosOfNextLabel += BST.PRINT_VERTICAL_GAP
  }
  if (tree.right != null) {
    this.cmd("Move", this.highlightID, tree.right.x, tree.right.y)
    this.printTreeRec(tree.right)
    this.cmd("Move", this.highlightID, tree.x, tree.y)
    this.cmd("Step")
  }
  return
}

BST.prototype.findCallback = function (event) {
  var findValue
  findValue = this.normalizeNumber(this.findField.value, 4)
  this.findField.value = ""
  this.implementAction(this.findElement.bind(this), findValue)
}

BST.prototype.findElement = function (findValue) {
  this.commands = []

  this.highlightID = this.nextIndex++

  this.doFind(this.treeRoot, findValue)

  return this.commands
}

BST.prototype.doFind = function (tree, value) {
  this.cmd("SetText", 0, "Searching for " + value)
  if (tree != null) {
    this.cmd("SetHighlight", tree.graphicID, 1)
    if (tree.data == value) {
      this.cmd(
        "SetText",
        0,
        "Searching for " +
          value +
          " : " +
          value +
          " = " +
          value +
          " (Element found!)"
      )
      this.cmd("Step")
      this.cmd("SetText", 0, "Found:" + value)
      this.cmd("SetHighlight", tree.graphicID, 0)
    } else {
      if (tree.data > value) {
        this.cmd(
          "SetText",
          0,
          "Searching for " +
            value +
            " : " +
            value +
            " < " +
            tree.data +
            " (look to left subtree)"
        )
        this.cmd("Step")
        this.cmd("SetHighlight", tree.graphicID, 0)
        if (tree.left != null) {
          this.cmd(
            "CreateHighlightCircle",
            this.highlightID,
            BST.HIGHLIGHT_CIRCLE_COLOR,
            tree.x,
            tree.y
          )
          this.cmd("Move", this.highlightID, tree.left.x, tree.left.y)
          this.cmd("Step")
          this.cmd("Delete", this.highlightID)
        }
        this.doFind(tree.left, value)
      } else {
        this.cmd(
          "SetText",
          0,
          "Searching for " +
            value +
            " : " +
            value +
            " > " +
            tree.data +
            " (look to right subtree)"
        )
        this.cmd("Step")
        this.cmd("SetHighlight", tree.graphicID, 0)
        if (tree.right != null) {
          this.cmd(
            "CreateHighlightCircle",
            this.highlightID,
            BST.HIGHLIGHT_CIRCLE_COLOR,
            tree.x,
            tree.y
          )
          this.cmd("Move", this.highlightID, tree.right.x, tree.right.y)
          this.cmd("Step")
          this.cmd("Delete", this.highlightID)
        }
        this.doFind(tree.right, value)
      }
    }
  } else {
    this.cmd(
      "SetText",
      0,
      "Searching for " + value + " : " + "< Empty Tree > (Element not found)"
    )
    this.cmd("Step")
    this.cmd(
      "SetText",
      0,
      "Searching for " + value + " : " + " (Element not found)"
    )
  }
}

BST.prototype.insertElement = function (insertedValue) {
  this.commands = new Array()
  this.cmd("SetText", 0, "Inserting " + insertedValue)
  this.highlightID = this.nextIndex++

  if (this.treeRoot == null) {
    this.cmd(
      "CreateCircle",
      this.nextIndex,
      insertedValue,
      this.startingX,
      BST.STARTING_Y
    )
    this.cmd("SetForegroundColor", this.nextIndex, BST.FOREGROUND_COLOR)
    this.cmd("SetBackgroundColor", this.nextIndex, BST.BACKGROUND_COLOR)
    this.cmd("Step")
    this.treeRoot = new BSTNode(
      insertedValue,
      this.nextIndex,
      this.startingX,
      BST.STARTING_Y
    )
    this.nextIndex += 1
  } else {
    this.cmd("CreateCircle", this.nextIndex, insertedValue, 100, 100)
    this.cmd("SetForegroundColor", this.nextIndex, BST.FOREGROUND_COLOR)
    this.cmd("SetBackgroundColor", this.nextIndex, BST.BACKGROUND_COLOR)
    this.cmd("Step")
    var insertElem = new BSTNode(insertedValue, this.nextIndex, 100, 100)

    this.nextIndex += 1
    this.cmd("SetHighlight", insertElem.graphicID, 1)
    const isInserted = this.insert(insertElem, this.treeRoot)
    if (!isInserted) {
      this.cmd("Delete", insertElem.graphicID)
    }
    this.resizeTree()
  }
  this.cmd("SetText", 0, "")
  return this.commands
}

BST.prototype.insert = function (elem, tree) {
  this.cmd("SetHighlight", tree.graphicID, 1)
  this.cmd("SetHighlight", elem.graphicID, 1)

  if (elem.data === tree.data) {
    this.cmd(
      "SetText",
      0,
      elem.data + " is already in the tree. Duplicate not allowed."
    )
    this.cmd("Step")
    this.cmd("SetHighlight", tree.graphicID, 0)
    this.cmd("SetHighlight", elem.graphicID, 0)
    return false
  }

  if (elem.data < tree.data) {
    this.cmd(
      "SetText",
      0,
      elem.data + " < " + tree.data + ".  Looking at left subtree"
    )
  } else {
    this.cmd(
      "SetText",
      0,
      elem.data + " >= " + tree.data + ".  Looking at right subtree"
    )
  }
  this.cmd("Step")
  this.cmd("SetHighlight", tree.graphicID, 0)
  this.cmd("SetHighlight", elem.graphicID, 0)

  if (elem.data < tree.data) {
    if (tree.left == null) {
      this.cmd("SetText", 0, "Found null tree, inserting element")

      this.cmd("SetHighlight", elem.graphicID, 0)
      tree.left = elem
      elem.parent = tree
      this.cmd("Connect", tree.graphicID, elem.graphicID, BST.LINK_COLOR)

      return true
    } else {
      this.cmd(
        "CreateHighlightCircle",
        this.highlightID,
        BST.HIGHLIGHT_CIRCLE_COLOR,
        tree.x,
        tree.y
      )
      this.cmd("Move", this.highlightID, tree.left.x, tree.left.y)
      this.cmd("Step")
      this.cmd("Delete", this.highlightID)
      return this.insert(elem, tree.left)
    }
  } else {
    if (tree.right == null) {
      this.cmd("SetText", 0, "Found null tree, inserting element")
      this.cmd("SetHighlight", elem.graphicID, 0)
      tree.right = elem
      elem.parent = tree
      this.cmd("Connect", tree.graphicID, elem.graphicID, BST.LINK_COLOR)
      elem.x = tree.x + BST.WIDTH_DELTA / 2
      elem.y = tree.y + BST.HEIGHT_DELTA
      this.cmd("Move", elem.graphicID, elem.x, elem.y)

      return true
    } else {
      this.cmd(
        "CreateHighlightCircle",
        this.highlightID,
        BST.HIGHLIGHT_CIRCLE_COLOR,
        tree.x,
        tree.y
      )
      this.cmd("Move", this.highlightID, tree.right.x, tree.right.y)
      this.cmd("Step")
      this.cmd("Delete", this.highlightID)
      return this.insert(elem, tree.right)
    }
  }
}

BST.prototype.deleteElement = function (deletedValue) {
  this.commands = []
  this.cmd("SetText", 0, "Deleting " + deletedValue)
  this.cmd("Step")
  this.cmd("SetText", 0, "")
  this.highlightID = this.nextIndex++
  this.treeDelete(this.treeRoot, deletedValue)
  this.cmd("SetText", 0, "")
  // Do delete
  return this.commands
}

BST.prototype.treeDelete = function (tree, valueToDelete) {
  var leftchild = false
  if (tree != null) {
    if (tree.parent != null) {
      leftchild = tree.parent.left == tree
    }
    this.cmd("SetHighlight", tree.graphicID, 1)
    if (valueToDelete < tree.data) {
      this.cmd(
        "SetText",
        0,
        valueToDelete + " < " + tree.data + ".  Looking at left subtree"
      )
    } else if (valueToDelete > tree.data) {
      this.cmd(
        "SetText",
        0,
        valueToDelete + " > " + tree.data + ".  Looking at right subtree"
      )
    } else {
      this.cmd(
        "SetText",
        0,
        valueToDelete + " == " + tree.data + ".  Found node to delete"
      )
    }
    this.cmd("Step")
    this.cmd("SetHighlight", tree.graphicID, 0)

    if (valueToDelete == tree.data) {
      if (tree.left == null && tree.right == null) {
        this.cmd("SetText", 0, "Node to delete is a leaf.  Delete it.")
        this.cmd("Delete", tree.graphicID)
        if (leftchild && tree.parent != null) {
          tree.parent.left = null
        } else if (tree.parent != null) {
          tree.parent.right = null
        } else {
          this.treeRoot = null
        }
        this.resizeTree()
        this.cmd("Step")
      } else if (tree.left == null) {
        this.cmd(
          "SetText",
          0,
          "Node to delete has no left child.  \nSet parent of deleted node to right child of deleted node."
        )
        if (tree.parent != null) {
          this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID)
          this.cmd(
            "Connect",
            tree.parent.graphicID,
            tree.right.graphicID,
            BST.LINK_COLOR
          )
          this.cmd("Step")
          this.cmd("Delete", tree.graphicID)
          if (leftchild) {
            tree.parent.left = tree.right
          } else {
            tree.parent.right = tree.right
          }
          tree.right.parent = tree.parent
        } else {
          this.cmd("Delete", tree.graphicID)
          this.treeRoot = tree.right
          this.treeRoot.parent = null
        }
        this.resizeTree()
      } else if (tree.right == null) {
        this.cmd(
          "SetText",
          0,
          "Node to delete has no right child.  \nSet parent of deleted node to left child of deleted node."
        )
        if (tree.parent != null) {
          this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID)
          this.cmd(
            "Connect",
            tree.parent.graphicID,
            tree.left.graphicID,
            BST.LINK_COLOR
          )
          this.cmd("Step")
          this.cmd("Delete", tree.graphicID)
          if (leftchild) {
            tree.parent.left = tree.left
          } else {
            tree.parent.right = tree.left
          }
          tree.left.parent = tree.parent
        } else {
          this.cmd("Delete", tree.graphicID)
          this.treeRoot = tree.left
          this.treeRoot.parent = null
        }
        this.resizeTree()
      } // tree.left != null && tree.right != null
      else {
        this.cmd(
          "SetText",
          0,
          "Node to delete has two children.  \nFind smallest node in right subtree."
        )

        this.highlightID = this.nextIndex
        this.nextIndex += 1
        this.cmd(
          "CreateHighlightCircle",
          this.highlightID,
          BST.HIGHLIGHT_CIRCLE_COLOR,
          tree.x,
          tree.y
        )
        var tmp = tree
        tmp = tree.right
        this.cmd("Move", this.highlightID, tmp.x, tmp.y)
        this.cmd("Step")
        while (tmp.left != null) {
          tmp = tmp.left
          this.cmd("Move", this.highlightID, tmp.x, tmp.y)
          this.cmd("Step")
        }
        this.cmd("SetText", tree.graphicID, " ")
        var labelID = this.nextIndex
        this.nextIndex += 1
        this.cmd("CreateLabel", labelID, tmp.data, tmp.x, tmp.y)
        tree.data = tmp.data
        this.cmd("Move", labelID, tree.x, tree.y)
        this.cmd(
          "SetText",
          0,
          "Copy smallest value of right subtree into node to delete."
        )

        this.cmd("Step")
        this.cmd("SetHighlight", tree.graphicID, 0)
        this.cmd("Delete", labelID)
        this.cmd("SetText", tree.graphicID, tree.data)
        this.cmd("Delete", this.highlightID)
        this.cmd("SetText", 0, "Remove node whose value we copied.")

        if (tmp.right == null) {
          if (tmp.parent != tree) {
            tmp.parent.left = null
          } else {
            tree.right = null
          }
          this.cmd("Delete", tmp.graphicID)
          this.resizeTree()
        } else {
          this.cmd("Disconnect", tmp.parent.graphicID, tmp.graphicID)
          this.cmd(
            "Connect",
            tmp.parent.graphicID,
            tmp.right.graphicID,
            BST.LINK_COLOR
          )
          this.cmd("Step")
          this.cmd("Delete", tmp.graphicID)
          if (tmp.parent != tree) {
            tmp.parent.left = tmp.right
            tmp.right.parent = tmp.parent
          } else {
            tree.right = tmp.right
            tmp.right.parent = tree
          }
          this.resizeTree()
        }
      }
    } else if (valueToDelete < tree.data) {
      if (tree.left != null) {
        this.cmd(
          "CreateHighlightCircle",
          this.highlightID,
          BST.HIGHLIGHT_CIRCLE_COLOR,
          tree.x,
          tree.y
        )
        this.cmd("Move", this.highlightID, tree.left.x, tree.left.y)
        this.cmd("Step")
        this.cmd("Delete", this.highlightID)
      }
      this.treeDelete(tree.left, valueToDelete)
    } else {
      if (tree.right != null) {
        this.cmd(
          "CreateHighlightCircle",
          this.highlightID,
          BST.HIGHLIGHT_CIRCLE_COLOR,
          tree.x,
          tree.y
        )
        this.cmd("Move", this.highlightID, tree.right.x, tree.right.y)
        this.cmd("Step")
        this.cmd("Delete", this.highlightID)
      }
      this.treeDelete(tree.right, valueToDelete)
    }
  } else {
    this.cmd(
      "SetText",
      0,
      "Element " + valueToDelete + " not found, could not delete"
    )
  }
}

BST.prototype.resizeTree = function () {
  var startingPoint = this.startingX
  this.resizeWidths(this.treeRoot)
  if (this.treeRoot != null) {
    if (this.treeRoot.leftWidth > startingPoint) {
      startingPoint = this.treeRoot.leftWidth
    } else if (this.treeRoot.rightWidth > startingPoint) {
      startingPoint = Math.max(
        this.treeRoot.leftWidth,
        2 * startingPoint - this.treeRoot.rightWidth
      )
    }
    this.setNewPositions(this.treeRoot, startingPoint, BST.STARTING_Y + (this.buildingTree? BST.BUILD_DELTA_Y : 0), 0)
    this.animateNewPositions(this.treeRoot)
    this.cmd("Step")
  }
}

BST.prototype.setNewPositions = function (tree, xPosition, yPosition, side) {
  if (tree != null) {
    tree.y = yPosition
    if (side == -1) {
      xPosition = xPosition - tree.rightWidth
    } else if (side == 1) {
      xPosition = xPosition + tree.leftWidth
    }
    tree.x = xPosition
    this.setNewPositions(tree.left, xPosition, yPosition + BST.HEIGHT_DELTA, -1)
    this.setNewPositions(tree.right, xPosition, yPosition + BST.HEIGHT_DELTA, 1)
  }
}
BST.prototype.animateNewPositions = function (tree) {
  if (tree != null) {
    this.cmd("Move", tree.graphicID, tree.x, tree.y)
    this.animateNewPositions(tree.left)
    this.animateNewPositions(tree.right)
  }
}

BST.prototype.resizeWidths = function (tree) {
  if (tree == null) {
    return 0
  }
  tree.leftWidth = Math.max(this.resizeWidths(tree.left), BST.WIDTH_DELTA / 2)
  tree.rightWidth = Math.max(this.resizeWidths(tree.right), BST.WIDTH_DELTA / 2)
  return tree.leftWidth + tree.rightWidth
}

function BSTNode(val, id, initialX, initialY) {
  this.data = val
  this.x = initialX
  this.y = initialY
  this.graphicID = id
  this.left = null
  this.right = null
  this.parent = null
}

BST.prototype.disableUI = function (event) {
  this.insertField.disabled = true
  this.insertButton.disabled = true
  this.deleteField.disabled = true
  this.deleteButton.disabled = true
  this.findField.disabled = true
  this.findButton.disabled = true
  this.printButton.disabled = true
  this.constructField.disabled = true
  this.constructButton.disabled = true
}

BST.prototype.enableUI = function (event) {
  this.insertField.disabled = false
  this.insertButton.disabled = false
  this.deleteField.disabled = false
  this.deleteButton.disabled = false
  this.findField.disabled = false
  this.findButton.disabled = false
  this.printButton.disabled = false
  this.constructField.disabled = false
  this.constructButton.disabled = false
}

var currentAlg

function init() {
  var animManag = initCanvas()
  currentAlg = new BST(animManag, canvas.width, canvas.height)
}