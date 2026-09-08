const meals = document.querySelector('.meal-carousel');
const previousMeal = document.querySelector('.meal-prev');
const nextMeal = document.querySelector('.meal-next');
function updateMealControls() {
  previousMeal.disabled = meals.scrollLeft <= 2;
  nextMeal.disabled = meals.scrollLeft >= meals.scrollWidth - meals.clientWidth - 2;
}
function moveMeal(direction) {
  const step = meals.querySelector('.meal-slide').getBoundingClientRect().width + 18;
  meals.scrollBy({left:direction*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
previousMeal.addEventListener('click',()=>moveMeal(-1));
nextMeal.addEventListener('click',()=>moveMeal(1));
meals.addEventListener('scroll',updateMealControls,{passive:true});
window.addEventListener('resize',updateMealControls);
updateMealControls();
