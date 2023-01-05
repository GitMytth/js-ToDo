class ApiService {

    fetchAllTodos() {
        return fetch('https://jsonplaceholder.typicode.com/posts')
        .then((res) => res.json());
    }

    create(data) {
        return fetch('https://jsonplaceholder.typicode.com/posts',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(data)
        }).then((res) => res.json())
    }

    edit(data, updId) {
        const id = updId;
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`,{
            method: 'PATCH',
            body: JSON.stringify(data),
            headers:{
                'Content-type': 'application/json; charset=UTF-8',
              },
        }).then((res) => res.json())
    }

    getName(id) {
        return fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
        .then((res) => res.json())
        .then((json) => json.username);
    }

    remove(id) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`,{
            method:'DELETE',
        });
    }
}

class ToDoService{

    constructor(api) {
        this.api = api;
        this.toDoList = window.document.querySelector('.todos__container');
        this._handleRemove = this._handleRemove.bind(this);
        this.openEditModal = this.openEditModal.bind(this);
        this._onEdit = this._onEdit.bind(this);
        this.editModal = document.querySelector('.edit-modal');
        
    }
    addTodo(name, title, body, id) {
        
        this.toDoList.append(this._createTodo(name, title, body, id));
    }

    _createTodo(name, title, body, id){
        
        const container = document.createElement('div');
        container.classList.add('todo__content');
    
        const userName = document.createElement('div');
        userName.classList.add('username');
        const nameElem = document.createElement('h3');
        nameElem.append(document.createTextNode(name));

        const idUser = document.createElement('div');
        idUser.classList.add('idForEdit');
        const IdUserElem = document.createElement('h3');
        IdUserElem.append(document.createTextNode(`UserId: ${name}`));
    
        this.api.getName(name).then((name) => nameElem.textContent = `UserName: ${name}`)

        const info = document.createElement('div');
        info.classList.add('info');
        const titleEl = document.createElement('div');
        titleEl.classList.add('title');
        const titleHead = document.createElement('h4');
        titleHead.append(document.createTextNode(`Title: ${title}`));
        const bodyEl = document.createElement('div');
        bodyEl.classList.add('body');
        const bodyHead = document.createElement('p');
        bodyHead.append(document.createTextNode(body));

        const editContainer = document.createElement('div');
        editContainer.classList.add('edit-button')
        const editBtn = document.createElement('button');
        editBtn.append(document.createTextNode('Edit'));
        
        const delContainer = document.createElement('div');
        delContainer.classList.add('delete-button')
        const delBtn = document.createElement('button');
        delBtn.append(document.createTextNode('Delete'));

        const buttonCont = document.createElement('div');
        buttonCont.classList.add('buttons')


        titleEl.append(titleHead);
        bodyEl.append(bodyHead);
        delContainer.append(delBtn);
        editContainer.append(editBtn);

        info.append(titleEl);
        info.append(bodyEl);
        userName.append(nameElem);
        idUser.append(IdUserElem);

        container.append(userName);
        container.append(idUser);
        container.append(info);
        
        buttonCont.append(delContainer);
        buttonCont.append(editContainer);
        container.append(buttonCont);

        container.setAttribute('id', id);

        delBtn.addEventListener('click', this._handleRemove);
        editBtn.addEventListener('click', this.openEditModal);

        return container;
    }

    _handleRemove(event) {
        const todo = event.target.parentElement.parentElement.parentElement;
        
        this.api.remove(todo.id).then((res) => {
            if(res.status >= 200 && res.status <= 300){
                event.target.removeEventListener('click',this._handleRemove);
                todo.remove();
            }
        })
    }

    openEditModal(event) {
        this.editModal.classList.toggle('hidden');
        const id = event.target.parentElement.parentElement.parentElement.id;
        const elem = event.target.parentElement.parentElement.parentElement;
        const userName = elem.querySelector('.idForEdit h3'),
                  title = elem.querySelector('.info .title h4'),
                  body = elem.querySelector('.info .body p');

        document.getElementsByName('title')[0].placeholder = `${title.textContent}`;
        document.getElementsByName('userid')[0].placeholder = `${userName.textContent}`;
        document.getElementsByName('body')[0].placeholder = `${body.textContent}`;
        const editBtn = document.querySelector('.on-edit-button');
        editBtn.addEventListener('click',() => this._onEdit(event, id, elem));
        
    }

    closeEdit() {

        this.editModal.classList.toggle('hidden');
    }

    _onEdit(event, id,elem) {

        event.preventDefault();

        const formData = {};
        const form = document.forms[0];
        const userName = elem.querySelector('.username h3'),
                  title = elem.querySelector('.info .title h4'),
                  body = elem.querySelector('.info .body p'),
                  changedId = elem.querySelector('.idForEdit h3');  

            Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });  

        formData['id'] = id;

        if (!this._validateForm(form, formData)) {
            return;
        }
        
        const userid = formData['userid'];
        this.api.edit(formData, id).then((data) => {
            title.textContent = `${data.title}`;
            body.textContent = `${data.body}`;
            changedId.textContent = `UserId: ${userid}`;

        }).then(this.api.getName(userid).then((name) => userName.textContent = `UserName: ${name}`));
        form.reset();
        this.closeEdit();
    }

    _validateForm(form, formData) {
        const errors = [];
        if (formData.userid > 10 || formData.userid < 0 || isNaN(+formData.userid)) {
            errors.push('Поле UserId не должно иметь значения больше 10 или меньше 0');
        }
        if (!formData.userid.length || !formData.title.length || !formData.body.length) {
            errors.push('Все поля должны быть заполнены!');
        }

        if (errors.length) {
            const errorEl = form.getElementsByClassName('form-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

class MainService {
    constructor(toDoService, modalService, api){
        this.modalService = modalService;
        this.api = api;
        this.toDoService = toDoService;
        this.addBtn = document.querySelector('.add-button');
        this.addBtn.addEventListener('click', (e) => this._onOpenModal(e));
    }

    fetchAllTodo() {
        
        this.api.fetchAllTodos().then((todos) => {
            todos.forEach((todo) =>
            
                this.toDoService.addTodo(todo.userId, todo.title, todo.body, todo.id)
            );
        });
    }

    _onOpenModal( ) {
        this.modalService.open();
    }
}

class ModalService {
    constructor(toDoService, api) {
        this.api = api;
        this.toDoService = toDoService;
        this.addModal = document.querySelector('.add-modal');
        this.editModal = document.querySelector('.edit-modal');
        this.editListener = this.closeEdit.bind(this);
        document.querySelector('.edit-close').addEventListener('click', this.editListener);
        this.listener = this.close.bind(this);
        document.querySelector('.add-close').addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn');
        this.submitBtn.addEventListener('click', this._onCreate.bind(this));

    }

    open() {
        this.addModal.classList.toggle('hidden');
    }

    close() {
        this.addModal.classList.toggle('hidden');
    }

    closeEdit() {
        this.editModal.classList.toggle('hidden');
    }

    _onCreate(event) {
        event.preventDefault();

        const formData = {};
        const form = document.forms[1];
        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });
        if (!this._validateForm(form, formData)) {
            return;
        }
        console.log(formData)

        this.api.create(formData).then((data) => {
            this.toDoService.addTodo(data.userid, data.title, data.body, data.id);
        });

        form.reset();
        this.close();
    }
   
    _validateForm(form, formData) {
        const errors = [];
        if (formData.userid > 10 || formData.userid < 0 || isNaN(+formData.userid)){
            errors.push('Поле UserId не должно иметь значения больше 10 или меньше 0');
        }
        if (!formData.userid.length || !formData.title.length || !formData.body.length) {
            errors.push('Все поля должны быть заполнены!');
        }

        if (errors.length) {
            const errorEl = form.getElementsByClassName('form-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

const api = new ApiService();
const toDoService = new ToDoService(api);
const modalService = new ModalService(toDoService, api);
const service = new MainService(toDoService, modalService, api);
service.fetchAllTodo();
