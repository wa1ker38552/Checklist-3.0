var currentlyEditing = null
var currentlyAdding = null
var currentlyEditingSubtask = null

function shiftHexColor(hex, shiftAmount=10) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, r + shiftAmount);
    g = Math.min(255, g + shiftAmount);
    b = Math.min(255, b + shiftAmount);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function formatDate(date) {
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function animateToast(e, text) {
    const t = dquery(e)

    t.innerHTML = text
    t.style.display = "block"
    t.offsetHeight
    t.style.opacity = 1
    setTimeout(function() {
        t.style.opacity = 0
        setTimeout(function() {t.style.display = "block"}, 2300)
    }, 2000)
}

function gdb(i) {
    return JSON.parse(localStorage.getItem(i))
}

function sdb(i, data) {
    return localStorage.setItem(i, JSON.stringify(data))
}
  
function createTag() {
    const tagName = dquery("#tagName").value
    let tagData = gdb("tagData")

    if (tagName.trim().length == 0 || tagName.length > 50) {
        animateToast("#failToast", "Invalid tag length!")
    } else if (tagData && tagName in tagData) {
        animateToast("#failToast", "Tag already exists!")
    } else {
        const color = dquery("#colorInput").value
        const secondartColor = dquery("#secondaryColorInput").value
        let data = {
            name: tagName,
            background: color,
            border: secondartColor
        }

        if (!tagData) {tagData = {}}
        tagData[tagName] = data
        sdb("tagData", tagData)
        animateCloseModal(dquery("#tagModal"))
        animateToast("#successToast", "Successfully created tag!")
    }
}

function deleteTag(name) {
    let tagData = gdb("tagData")
    if (tagData && name in tagData) {
        delete tagData[name]
        sdb("tagData", tagData)
    }
}

function createTagElement(tag, canDelete=false) {
    const e = dcreate("div", `tag${(canDelete) ? " existing-tag": ""}`)
    e.style.backgroundColor = tag.background
    e.style.borderColor = tag.border
    e.textContent = tag.name
    e.style.color = tag.border
    e.dataset.selected = "false"
    if (canDelete) {
        e.onclick = function() {
            deleteTag(tag.name)
            animateToast("#successToast", "Successfully deleted tag!")
            refreshTags("#tagsCreateTagContainer", true)
        }
    } else if (canDelete == null) {
        // nothing for now
    } else {
        e.style.cursor = "pointer"
        e.onclick = function() {
            if (e.dataset.selected == "false") {
                e.dataset.selected = "true"
                e.style.filter = "brightness(0.5)"
            } else {
                e.dataset.selected = "false"
                e.style.filter = ""
            }
        }
    }
    return e 
}

function refreshTags(parent, canDelete) {
    const tagsCreateTagContainer = dquery(parent)
    const tagData = gdb("tagData")

    tagsCreateTagContainer.innerHTML = ""
    setTimeout(function() {
        for (tag in tagData) {
            tagsCreateTagContainer.append(createTagElement(tagData[tag], canDelete))
        }
        if (tagsCreateTagContainer.innerHTML == "") {
            tagsCreateTagContainer.innerHTML = "<i style='font-size: 0.8rem; color: var(--text-light);'>No tags exist</i>"
        }
    }, 100)
}

function createItem() {
    const itemName = dquery("#itemName").value
    
    if (itemName.trim().length == 0 || itemName.length > 70) {
        animateToast("#failToast", "Invalid name length")
    } else {
        let itemData = gdb("upcomingData")
        let star = dquery(".star-icon")
        let tags = []

        let tagElements = dquery("#itemCreateTagContainer").children
        for (let i=0; i<tagElements.length; i++) {
            if (tagElements[i].dataset.selected == "true") {
                tags.push(tagElements[i].innerHTML)
            }
        }

        if (!itemData) {itemData = {}}
        taskId = btoa(`${Date.now()}${itemName}${tags}`)
        itemData[taskId] = {
            name: itemName,
            created: Date.now(),
            important: (star.src.includes("icon_star.png")) ? false : true,
            tags: tags,
            id: taskId,
            subTasks: {}
        }
        sdb("upcomingData", itemData)
        animateCloseModal(dquery('#itemModal'))
        animateToast("#successToast", "Successfully created task!")
        refreshChecklist()
    }
}

function createSubTask() {
    const createSubTaskName = dquery("#createSubTaskName").value
    if (createSubTaskName.trim().length == 0 || createSubTaskName.length > 70){
        animateToast("#failToast", "Invalid name length!")
    } else {
        const itemData = gdb("upcomingData")
        const id = btoa(createSubTaskName+Date.now().toString())
        itemData[currentlyAdding].subTasks[id] = {
            name: createSubTaskName,
            id: id,
            completed: false
        }
        sdb("upcomingData", itemData)
        animateCloseModal(dquery("#createSubTaskModal"))
        animateToast("#successToast", "Successfully created sub-task!")
        refreshChecklist()
    }
}

function renderTask(task) {
    const parent = dcreate("div", "task-parent")
    const e = dcreate("div", `centered-vertically checklist-item${(task.important) ? " important-item" : ""}`)
    const textContainer = dcreate("div")
    const header = dcreate("div", "centered-vertically item-header")
    const date = dcreate("h4", "", formatDate(new Date(task.created)))
    const name = dcreate("h3", "", task.name)
    const tagData = gdb("tagData")

    e.id = task.id
    header.append(date)
    textContainer.append(header, name)
    task.tags.forEach(function(tag) {
        try {
            header.append(createTagElement(tagData[tag], null))
        } catch (Exception) {
            header.append(createTagElement({
                name: "Deleted Tag",
                background: "",
                border: ""
            }, null))
        }
    })
    const buttonRow = dcreate("div", "centered-vertically item-actions")
    const b1 = dcreate("button")
    const i1 = dcreate("img")
    const b2 = dcreate("button")
    const i2 = dcreate("img")
    const b3 = dcreate("button")
    const i3 = dcreate("img")
    const b4 = dcreate("button")
    const i4 = dcreate("img")
    i1.src = "assets/icon_check.png"
    i2.src = "assets/icon_add.png"
    i3.src = "assets/icon_edit.png"
    i4.src = "assets/icon_delete.png"
    b1.append(i1)
    b2.append(i2)
    b3.append(i3)
    b4.append(i4)
    const t1 = dcreate("div", "tooltip", "Mark as complete")
    const t2 = dcreate("div", "tooltip", "Create sub-task")
    const t3 = dcreate("div", "tooltip", "Edit task")
    const t4 = dcreate("div", "tooltip", "Delete task")
    b1.append(t1)
    b2.append(t2)
    b3.append(t3)
    b4.append(t4)
    
    b1.onclick = function() {
        const upcomingData = gdb("upcomingData")
        let completeData = gdb("completeData")
        if (!completeData) {completeData = {}}
        completeData[task.id] = upcomingData[task.id]
        delete upcomingData[task.id]
        sdb("upcomingData", upcomingData)
        sdb("completeData", completeData)
        animateToast("#successToast", "Successfully marked as completed!")
        refreshChecklist()
    }
    b2.onclick = function() {
        currentlyAdding = task.id
        animateOpenModal(dquery("#createSubTaskModal"))
    }
    b3.onclick = function() {
        currentlyEditing = task.id
        dquery("#editItemName").value = task.name
        dquery(".star-icon").src = (task.important) ? "assets/icon_star_filled.png" : "assets/icon_star.png"
        dquery("#editItemNameIndicator").innerHTML = task.name.length
        refreshTags("#editItemCreateTagContainer", false)
        setTimeout(function() {
            let tc = dquery("#editItemCreateTagContainer").children
            for (let i=0; i<tc.length; i++) {
                if (task.tags.includes(tc[i].textContent)) {
                    tc[i].dataset.selected = "true"
                    tc[i].style.filter = "brightness(0.5)"
                }
            }
            animateOpenModal(dquery("#editItemModal"))
        }, 100)
    }
    b4.onclick = function() {
        const upcomingData = gdb("upcomingData")
        delete upcomingData[task.id]
        sdb("upcomingData", upcomingData)
        animateToast("#successToast", "Successfully deleted task!")
        refreshChecklist()
    }

    const subTaskContainer = dcreate("div", "sub-task-container")
    for (sub in task.subTasks) {
        subTaskContainer.append(renderSubTask(task.id, task.subTasks[sub]))
    }

    buttonRow.append(b1, b2, b3, b4)
    e.append(textContainer, buttonRow)
    parent.append(e, subTaskContainer)
    return parent
}

function renderSubTask(id, task) {
    const e = dcreate("div", "centered-vertically sub-task")
    const textContainer = dcreate("div")
    const title = dcreate("h3", "", task.name)
    const check = dcreate("input", "sub-check")
    check.type = "checkbox"

    if (task.completed) {
        check.checked = true
        title.style.textDecoration = "line-through"
    }

    check.onchange = function() {
        let data = gdb("upcomingData")
        data[id].subTasks[task.id].completed = check.checked
        sdb("upcomingData", data)
        refreshChecklist()
    }

    const buttonRow = dcreate("div", "centered-vertically item-actions")
    const b1 = dcreate("button")
    const i1 = dcreate("img")
    const b2 = dcreate("button")
    const i2 = dcreate("img")
    i1.src = "assets/icon_edit.png"
    i2.src = "assets/icon_delete.png"
    b1.append(i1)
    b2.append(i2)
    const t1 = dcreate("div", "tooltip", "Edit sub-task")
    const t2 = dcreate("div", "tooltip", "Delete sub-task")
    b1.append(t1)
    b2.append(t2)
    buttonRow.append(b1, b2)

    b1.onclick = function() {
        currentlyEditingSubtask = [id, task.id]
        dquery("#editSubTaskName").value = task.name
        dquery("#editSubTaskNameIndicator").innerHTML = task.name.length
        animateOpenModal(dquery("#editSubTaskModal"))
    }
    b2.onclick = function() {
        let data = gdb("upcomingData")
        delete data[id].subTasks[task.id]
        sdb("upcomingData", data)
        animateToast("#successToast", "Successfully deleted sub-task!")
        refreshChecklist()
    }

    textContainer.append(title)
    e.append(check, textContainer, buttonRow)
    return e
}

function editSubTask() {
    const subTaskName = dquery("#editSubTaskName").value

    if (subTaskName.trim().length == 0 || subTaskName.length > 70) {
        animateToast("#failToast", "Invalid name length!")
    } else {
        const data = gdb("upcomingData")
        data[currentlyEditingSubtask[0]].subTasks[currentlyEditingSubtask[1]].name = subTaskName
        sdb("upcomingData", data)
        animateCloseModal(dquery("#editSubTaskModal"))
        animateToast("#successToast", "Successfully updated sub-task!")
        refreshChecklist()
    }
}

function editItem() {
    const editItemName = dquery("#editItemName").value
    if (editItemName.trim().length == 0 || editItemName.length > 70) {
        animateToast("#failToast", "Invalid name length")
    } else {
        const upcomingData = gdb("upcomingData")
        const starIcon = dquery(".star-icon")
        if (currentlyEditing in upcomingData) {
            upcomingData[currentlyEditing]["name"] = editItemName
            upcomingData[currentlyEditing]["important"] = (starIcon.src.includes("icon_star.png")) ? false : true
            let tags = []
            let tc = dquery("#editItemCreateTagContainer").children
            for (let i=0; i<tc.length; i++) {
                if (tc[i].dataset.selected == "true") {
                    tags.push(tc[i].textContent)
                }
            }
            upcomingData[currentlyEditing]["tags"] = tags
            sdb("upcomingData", upcomingData)
            animateCloseModal(dquery("#editItemModal"))
            animateToast("#successToast", "Successfully updated task!")
            refreshChecklist()
        } else {
            animateToast("#failToast", "Invalid currently editing task")
        }
    }
}

function refreshChecklist() {
    let itemData = gdb("upcomingData")
    const parent = dquery(".wrapper")

    parent.innerHTML = ""
    for (task in itemData) {
        if (itemData[task].important) {
            parent.prepend(renderTask(itemData[task]))
        } else {
            parent.append(renderTask(itemData[task]))
        }
    }

    if (parent.innerHTML == "") {
        parent.innerHTML = "<i style='color: var(--text-light)'>No tasks yet!</i>"
    }
}

window.onload = function() {
    const modalBackgrounds = Array.from(document.getElementsByClassName("modal-background"))
    const tagPreview = dquery("#previewTag")
    refreshTags("#tagsCreateTagContainer", true)
    refreshTags("#itemCreateTagContainer", false)

    refreshChecklist()

    window.onclick = function(e) {
        if (modalBackgrounds.includes(e.target)) {
            animateCloseModal(e.target)
        }
    }

    const tagIndicator = dquery("#tagNameIndicator")
    dquery("#tagName").oninput = function(e) {
        let length = e.target.value.length
        tagIndicator.innerHTML = length
        tagIndicator.parentElement.style.color = (length > 50) ? "red" : ""

        if (e.target.value != "") {
            tagPreview.textContent = e.target.value
        } else {
            tagPreview.innerHTML = "&nbsp;"
        }
    }

    const colorIndicator = dquery("#colorIndicator")
    const secondaryIndicator = dquery("#secondaryColorIndicator")
    const secondaryColorInput = dquery("#secondaryColorInput")
    dquery("#colorInput").oninput = function(e) {
        colorIndicator.innerHTML = e.target.value
        secondaryColorInput.value = shiftHexColor(e.target.value, -50)
        secondaryIndicator.innerHTML = secondaryColorInput.value

        tagPreview.style.background = e.target.value
        tagPreview.style.borderColor = secondaryColorInput.value
        tagPreview.style.color = secondaryColorInput.value
    }

    secondaryColorInput.oninput = function(e) {
        tagPreview.style.borderColor = e.target.value
        tagPreview.style.color = e.target.value
        secondaryIndicator.innerHTML = secondaryColorInput.value
    }

    const itemNameIndicator = dquery("#itemNameIndicator")
    dquery("#itemName").oninput = function(e) {
        let length = e.target.value.length
        itemNameIndicator.innerHTML = length
        itemNameIndicator.parentElement.style.color = (length > 70) ? "red" : ""
    }

    const editItemNameIndicator = dquery("#editItemNameIndicator")
    dquery("#editItemName").oninput = function(e) {
        let length = e.target.value.length
        editItemNameIndicator.innerHTML = length
        editItemNameIndicator.parentElement.style.color = (length > 70) ? "red" : ""
    }

    const createSubTaskNameIndicator = dquery("#createSubTaskNameIndicator")
    dquery("#createSubTaskName").oninput = function(e) {
        let length = e.target.value.length
        createSubTaskNameIndicator.innerHTML = length
        createSubTaskNameIndicator.parentElement.style.color = (length > 70) ? "red" : ""
    }

    const editSubTaskNameIndicator = dquery("#editSubTaskNameIndicator")
    dquery("#editSubTaskName").oninput = function(e) {
        let length = e.target.value.length
        editSubTaskNameIndicator.innerHTML = length
        editSubTaskNameIndicator.parentElement.style.color = (length > 70) ? "red" : ""
    }
}