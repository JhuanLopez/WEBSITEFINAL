
// Animation for the content slide 
const boxes = document.querySelectorAll('.box');
window.addEventListener('scroll', checkBoxes);

checkBoxes();

function checkBoxes(){
    const triggerBottom = window.innerHeight / 5 * 4;

    boxes.forEach((box) => {
        const boxtop = box.getBoundingClientRect().top;
        if (boxtop < triggerBottom){
        box.classList.add('show');
        }else{
            box.classList.remove('show')
        }

    })
};
// For fade animation
let btn = document.querySelector('#btn');  
let sidebar = document.querySelector('.sidebar');

btn.onclick = function () {
    sidebar.classList.toggle('active');
};

const fade = document.querySelectorAll('.Fade');
window.addEventListener('scroll', checkFades);

checkFades();

function checkFades(){
    const triggerBottom = window.innerHeight / 5 * 4;

    fade.forEach((Fade) => {
        const boxtop = box.getBoundingClientRect().top;
        if (boxtop < triggerBottom){
        box.classList.add('Fadein');
        }else{
            box.classList.remove('Fadein')
        }

    })
};
