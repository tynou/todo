import {format, isWithinInterval, startOfWeek, endOfWeek} from "date-fns";
import './style.css';

const sidebar = document.querySelector(".sidebar");

const categories = document.querySelectorAll(".category");
const newEntryBtn = document.querySelector("#new-entry");

const todoContainer = document.querySelector(".main");
const listContainer = document.querySelector(".lists");

const deleteListBtn = document.querySelector("#delete-list");

const blurOverlay = document.querySelector("#blur-overlay");
const modal = document.querySelector("#modal");

const createOptions = document.querySelector("#popup-options");

const options = document.querySelectorAll(".option");

const modalTitle = document.querySelector("#modal-title");
const modalDesc = document.querySelector("#modal-desc");
const modalDate = document.querySelector("#modal-date");
const modalSubmit = document.querySelector("#modal-submit");

const closeModalBtn = document.querySelector("#close-modal");

const openSidebarBtn = document.querySelector("#open-sidebar");

const loadData = true;
const todos = loadData ? JSON.parse(localStorage.getItem("todos")) || {} : {};

let chosen = {type: "category", category: "all", element: categories[0]};
let entry = "todo";
let sidebarOpen = false;



const isEmpty = (obj) => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) return false;
    }
    return true;
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const save = () => {
    localStorage.setItem("todos", JSON.stringify(todos));
};

const addTodo = (listName, todoName, description, date) => {
    if (!todos.hasOwnProperty(listName)) { return }

    const todo = {
        name: todoName,
        description: description,
        due: date ? date.setHours(0,0,0,0) : new Date().setHours(0,0,0,0),
        list: listName,
        done: false,
    };

    todos[listName].push(todo);

    todos[listName].sort((a, b) => b.due - a.due);

    save();
};

const addList = (listName) => {
    if (todos.hasOwnProperty(listName)) { return }

    todos[listName] = [];

    save();
};

const deleteTodo = (list, index) => {
    list.splice(index, 1);

    renderTodos();

    save();
};

const deleteList = () => {
    delete todos[chosen.listName];

    renderListNames();

    changeChosen({type: "category", category: "all", element: categories[0]});
    renderTodos();

    save();
};

const getCategoryTodos = (category) => {
    const list = [];

    switch (category) {
        case "all":
            for (let key in todos) { todos[key].forEach(todo => { list.push(todo) }) }
            break
        case "today":
            for (let key in todos) { todos[key].forEach(todo => { if (format(todo.due, "y MMM do") === format(new Date(), "y MMM do")) { list.push(todo) } }) }
            break
        case "week":
            const today = new Date();

            for (let key in todos) {
                todos[key].forEach(todo => {
                    if (isWithinInterval(todo.due, {start: startOfWeek(today, {weekStartsOn: 1}), end: endOfWeek(today, {weekStartsOn: 1})})) { list.push(todo) }
                });
            }
            break;
    }

    list.sort((a, b) => b.due - a.due);

    return list;
};

const renderTodos = () => {
    let list;
    switch (chosen.type) {
        case "category":
            list = getCategoryTodos(chosen.category);
            break;
        case "list":
            list = todos[chosen.listName];
            break;
    }

    document.querySelectorAll(".todo").forEach(element => {
        element.remove();
    });

    deleteListBtn.classList.add("disabled");
    if (list.length === 0 && chosen.type !== "category") {
        deleteListBtn.classList.remove("disabled");

        return;
    }

    list.forEach((todo) => {
        const newTodo = document.createElement("div");
        newTodo.classList = todo.done ? "todo done" : "todo";

        const doneCheck = document.createElement("div");
        doneCheck.classList = "done-check";
        newTodo.append(doneCheck);
        const checkIcon = document.createElement("i")
        checkIcon.classList = todo.done ? "fa-solid fa-check" : "";
        doneCheck.append(checkIcon);

        const name = document.createElement("p");
        name.classList = "name";
        name.innerText = todo.name;
        newTodo.append(name);

        const due = document.createElement("p");
        due.classList = "due";
        due.innerText = format(todo.due, "MMM do");
        newTodo.append(due);

        const edit = document.createElement("div");
        edit.classList = "icon btn";
        const editIcon = document.createElement("i")
        editIcon.classList = "fa-solid fa-pen-to-square";
        edit.append(editIcon);
        newTodo.append(edit);

        const remove = document.createElement("div");
        remove.classList = "icon btn";
        const removeIcon = document.createElement("i")
        removeIcon.classList = "fa-solid fa-trash";
        remove.append(removeIcon);
        newTodo.append(remove);

        doneCheck.addEventListener("click", () => {
            todo.done = !todo.done;
            checkIcon.classList = todo.done ? "fa-solid fa-check" : "";
            newTodo.classList.toggle("done");
        });

        remove.addEventListener("click", () => {
            deleteTodo(todos[todo.list], todos[todo.list].indexOf(todo));
        });

        edit.addEventListener("click", () => {
            openModal({type: "edit", obj: todo});
        });

        todoContainer.append(newTodo);
    });
};

const renderListNames = () => {
    listContainer.innerHTML = "";

    for (let listName in todos) {
        const newList = document.createElement("div");
        newList.classList = "list";

        const paperclip = document.createElement("div");
        paperclip.classList = "icon";
        const paperclipIcon = document.createElement("i")
        paperclipIcon.classList = "fa-solid fa-paperclip";
        paperclip.append(paperclipIcon);
        newList.append(paperclip);

        const name = document.createElement("p");
        name.classList = "list-name";
        name.innerText = listName;
        newList.append(name);

        listContainer.append(newList);

        newList.addEventListener("click", () => {
            changeChosen({type: "list", listName: listName, element: newList});
            renderTodos();
        });
    }
};

const changeChosen = (newChosen) => {
    chosen.element.classList.remove("chosen");
    newChosen.element.classList.add("chosen");

    chosen = newChosen;
};

const changeModal = (newEntry) => {
    if (entry === "todo" || entry === "list") { document.querySelector(`#${entry}`).classList.remove("chosen") }
    if (newEntry === "todo" || newEntry === "list") { document.querySelector(`#${newEntry}`).classList.add("chosen") }
    entry = newEntry;

    switch (entry) {
        case "todo":
            modalTitle.removeAttribute("readonly");
            modalDesc.removeAttribute("readonly");
            modalDesc.parentNode.classList.remove("disabled");
            modalDate.removeAttribute("readonly");
            modalDate.parentNode.classList.remove("disabled");
            modalSubmit.classList.remove("disabled");
            modalSubmit.innerHTML = "Create";
            break;
        case "list":
            modalTitle.removeAttribute("readonly");
            modalDesc.parentNode.classList.add("disabled");
            modalDate.parentNode.classList.add("disabled");
            modalSubmit.classList.remove("disabled");
            modalSubmit.innerHTML = "Create";
            break;
        case "edit":
            modalTitle.removeAttribute("readonly");
            modalDesc.removeAttribute("readonly");
            modalDesc.parentNode.classList.remove("disabled");
            modalDate.removeAttribute("readonly");
            modalDate.parentNode.classList.remove("disabled");
            modalSubmit.classList.remove("disabled");
            modalSubmit.innerHTML = "Edit";
            break;
        case "details":
            modalTitle.setAttribute("readonly");
            modalDesc.setAttribute("readonly");
            modalDesc.parentNode.classList.remove("disabled");
            modalDate.setAttribute("readonly");
            modalDate.parentNode.classList.remove("disabled");
            modalSubmit.classList.add("disabled");
            break;
    }
};

const openModal = (params) => {
    blurOverlay.classList.add("active");
    modal.classList.add("active");

    modalTitle.value = "";
    modalDesc.value = "";
    modalDate.value = "";

    switch (params.type) {
        case "new-entry":
            createOptions.classList.remove("disabled");
            changeModal("todo");

            modalSubmit.onclick = () => {
                if (modalTitle.value === "") {
                    displayError(modalTitle.parentNode, "the title must not be empty");
                    return;
                }
                if (chosen.type === "category" && entry === "todo") {
                    displayError(modalSubmit.parentNode, "select a list first");
                    return;
                }
                if (entry === "list" && todos.hasOwnProperty(modalTitle.value)) {
                    displayError(modalTitle.parentNode, "a list with that name already exists");
                    return;
                }

                switch (entry) {
                    case "todo":
                        addTodo(chosen.listName, modalTitle.value, modalDesc.value, modalDate.value ? new Date(modalDate.value) : new Date());
                        break;
                    case "list":
                        addList(modalTitle.value)
                        renderListNames();
                        break;
                }

                closeModal();

                renderTodos();
            }
            break;
        case "edit":
            createOptions.classList.add("disabled");
            changeModal("edit");

            modalTitle.value = params.obj.name;
            modalDesc.value = params.obj.description;
            modalDate.value = format(params.obj.due, "yyyy-MM-dd");

            modalSubmit.onclick = () => {
                if (modalTitle.value === "") {
                    displayError(modalTitle.parentNode, "the title must not be empty");
                    return;
                }

                params.obj.name = modalTitle.value;
                params.obj.description = modalDesc.value;
                params.obj.due = new Date(modalDate.value).setHours(0,0,0,0);

                closeModal();

                renderTodos();
            }
            break;
    }
};

const closeModal = () => {
    blurOverlay.classList.remove("active");
    modal.classList.remove("active");

    modalSubmit.onclick = undefined;
};

const displayError = (inputBlock, errorText) => {
    const error = inputBlock.querySelector(".error-text");

    inputBlock.classList.add("error");
    error.classList.add("enabled");

    error.innerHTML = errorText;

    sleep(2000).then(() => {
        inputBlock.classList.remove("error");
        error.classList.remove("enabled");
    });
};



categories.forEach((cat) => {
    cat.addEventListener("click", () => {
        changeChosen({type: "category", category: cat.id, element: cat});
        renderTodos();
    });
});

options.forEach((opt) => {
    opt.addEventListener("click", () => {
        changeModal(opt.id);
    });
})

newEntryBtn.addEventListener("click", () => {
    openModal({type: "new-entry"});
});

closeModalBtn.addEventListener("click", closeModal);

deleteListBtn.addEventListener("click", deleteList);

openSidebarBtn.addEventListener("click", () => {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle("closed");
    openSidebarBtn.classList.toggle("closed");

    const icon = openSidebarBtn.querySelector(".icon > i");
    if (sidebarOpen) {
        icon.classList = "fa-solid fa-xmark";
    } else {
        icon.classList = "fa-solid fa-bars";
    }
});


if (isEmpty(todos)) {
    addList("folder");
    addList("top secret");
    
    addTodo("folder", "tutturu", "my watch isn't working.. ;(", new Date());
    addTodo("folder", "adihtsdgsds", "dfgdfg", new Date(2024, 5, 24));
    addTodo("folder", "watch steins;gate", "i heard it's good", new Date(2024, 5, 16));
    addTodo("top secret", "hack to the gate", "no desc", new Date(2024, 5, 17));
    addTodo("top secret", "send a d-mail", "using the Phone Microwave (name subject to change)", new Date(2024, 5, 23));
    addTodo("top secret", "save Makise Kurisu", "we preventing the WW3 with this one", new Date(2024, 6, 28));
}

renderTodos();
renderListNames();