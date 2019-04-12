/* eslint-disable no-unused-vars */
const switchClass = (target, toggleClass, type = 'toggle') => {
  try {
    const navs = document.querySelectorAll(`${target}`);
    navs.forEach((nav) => {
      if (type === 'toggle')nav.classList.toggle(toggleClass);
      if (type === 'add' && !nav.classList.contains(toggleClass))nav.classList.add(toggleClass);
      if (type === 'remove' && nav.classList.contains(toggleClass))nav.classList.remove(toggleClass);
    });
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
};
const formToJson = (form) => {
  const inputs = [].slice.call(form.elements);
  const val = {};
  inputs.forEach((input) => {
    if (['checkbox', 'radio'].indexOf(input.type) !== -1 && input.name !== '') {
      val[input.name] = val[input.name] || [];
      if (input.checked) val[input.name] = input.type === 'radio' ? input.value : val[input.name].push(input.value);
    } else if (input.name !== '') val[input.name] = input.value;
  });
  return val;
};
const switchTab = (nav, changeTab = true) => {
  if (changeTab) {
    switchClass('.tab.block', 'gone', 'add');
    switchClass('.tab.block.gone', 'block', 'remove');
    switchClass(`.${nav}.gone`, 'block', 'add');
    switchClass(`.${nav}.gone.block`, 'gone', 'remove');
  }
  /* fetchData(nav); */
};
const switchEvents = (target, arg) => {
  document.querySelector(target)
    .addEventListener('click', () => {
      switchClass(arg[0], arg[1], arg[2]);
    });
};
const resetTab = () => {
  switchClass('.wrapper .main', 'selected', 'remove');
  setTimeout(() => {
    switchClass('.tab.block .left-body.tab-content', 'display', 'remove');
    switchClass('.tab.block .right-body.tab-content', 'display', 'add');
  }, 500);
};
const labelShow = () => {
  const inputs = document.querySelectorAll('.input-group .inputs');
  inputs.forEach((input) => {
    input.addEventListener('focusin', (event) => {
      event.target.parentNode.querySelector('label').classList.add('show');
    });
    input.addEventListener('focusout', (event) => {
      event.target.parentNode.querySelector('label').classList.remove('show');
    });
  });
};
labelShow();
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  if (match) return match[2];
};
const server = async (
  url = '',
  method = '',
  body = {},
  resolve = (res) => {},
  reject = (err) => {}) => {
  body = JSON.stringify(body);
  console.log(document.cookie);
  const payload = method !== 'GET' ? {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body,
  } : {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  /* const endpoint = `https://epic-mail-application.herokuapp.com/api/v1/${url}`; */
  const endpoint = `http://localhost:3000/api/v1/${url}`;
  await fetch(endpoint, payload)
    .then(resp => resp.json())
    .then((res) => {
      setTimeout(() => { resolve(res); }, 0);
    }).catch((err) => {
      reject(err);
    });
};


const toggleLoader = (btn = '.submit', res = '.resp', loadr = '.loader') => {
  const loader = document.querySelector(loadr);
  const resp = document.querySelectorAll(res);
  if (loader.classList.contains('gone')) {
    resp.forEach((elem) => { elem.textContent = ''; });
    loader.classList.remove('gone');
    switchClass(res, 'gone', 'add');
    document.querySelectorAll(btn).forEach((elem) => { elem.disabled = true; });
  } else {
    loader.classList.add('gone');
    switchClass(res, 'gone', 'remove');
    document.querySelectorAll(btn).forEach((elem) => { elem.disabled = false; });
  }
};