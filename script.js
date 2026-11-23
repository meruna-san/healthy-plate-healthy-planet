
const scenes = document.querySelectorAll('.scene');
let hasUnlockedGame = false;

function goToScene(id) {
    closeAllModals();
    scenes.forEach(s => s.classList.remove('active'));
    const targetScene = document.getElementById(id);
    if (targetScene) {
        setTimeout(() => {
            targetScene.classList.add('active');
        }, 150);
    }
}

function closeAllModals() {
    document.querySelectorAll('.achievement-modal').forEach(modal => {
        modal.classList.remove('open');
    });
}

function selectColor(color, el) {
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    if (el) el.classList.add('selected');
    
    const activePlate = document.getElementById('activePlate');
    if (activePlate) {
        activePlate.style.background = color;
    }
    
    setTimeout(() => goToScene('scene-build'), 300);
}

document.querySelectorAll('.draggable').forEach(item => {
    item.addEventListener('dragstart', e => {
        if (hasUnlockedGame) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('src', item.dataset.src);
        e.dataTransfer.setData('size', item.dataset.size || '65');
        item.style.opacity = '0.4';
    });
    
    item.addEventListener('dragend', () => {
        item.style.opacity = '1';
    });
    
    item.addEventListener('touchstart', handleTouchStart, { passive: false });
    item.addEventListener('touchmove', handleTouchMove, { passive: false });
    item.addEventListener('touchend', handleTouchEnd);
});

const dropZone = document.getElementById('dropZone');
if (dropZone) {
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        if (!hasUnlockedGame) dropZone.style.transform = 'scale(1.03)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.transform = 'scale(1)';
    });

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.style.transform = 'scale(1)';
        
        if (hasUnlockedGame) return;
        
        const src = e.dataTransfer.getData('src');
        const size = e.dataTransfer.getData('size');
        const foodLayer = document.getElementById('foodLayer');
        
        if (foodLayer) {
            const rect = foodLayer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            addFood(src, size, x, y);
        }
    });
}

let touchItem = null;
let touchClone = null;

function handleTouchStart(e) {
    if (hasUnlockedGame) return;
    touchItem = e.target;
    touchClone = touchItem.cloneNode(true);
    
    Object.assign(touchClone.style, {
        position: 'fixed',
        width: '60px',
        height: '60px',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0.8'
    });
    
    document.body.appendChild(touchClone);
    moveTouch(e.touches[0]);
}

function handleTouchMove(e) {
    e.preventDefault();
    moveTouch(e.touches[0]);
}

function handleTouchEnd(e) {
    if (!touchClone || !touchItem || hasUnlockedGame) return;
    
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (target && target.closest('#dropZone')) {
        const foodLayer = document.getElementById('foodLayer');
        if (foodLayer) {
            const rect = foodLayer.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            addFood(touchItem.dataset.src, touchItem.dataset.size || '65', x, y);
        }
    }
    
    touchClone.remove();
    touchClone = null;
    touchItem = null;
}

function moveTouch(t) {
    if (touchClone) {
        touchClone.style.left = (t.clientX - 30) + 'px';
        touchClone.style.top = (t.clientY - 30) + 'px';
    }
}

function addFood(src, size, x, y) {
    if (!src || hasUnlockedGame) return;
    const foodLayer = document.getElementById('foodLayer');
    if (!foodLayer) return;

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Food item';
    img.className = 'dropped-item';
    
    const pxSize = parseInt(size, 10) || 65;
    img.style.width = pxSize + 'px';
    img.style.height = pxSize + 'px';
    
    const layerWidth = foodLayer.clientWidth || 310;
    const layerHeight = foodLayer.clientHeight || 310;
    
    const offsetX = (Math.random() * 10) - 5;
    const offsetY = (Math.random() * 10) - 5;
    
    const safeX = Math.max(10, Math.min(x - (pxSize / 2) + offsetX, layerWidth - pxSize - 10));
    const safeY = Math.max(10, Math.min(y - (pxSize / 2) + offsetY, layerHeight - pxSize - 10));
    
    img.style.left = safeX + 'px';
    img.style.top = safeY + 'px';
    
    const rotation = (Math.random() * 40) - 20;
    img.style.setProperty('--r', rotation + 'deg');
    
    foodLayer.appendChild(img);
    updateStats();
}

function updateStats() {
    const foodLayer = document.getElementById('foodLayer');
    const countVal = document.getElementById('countVal');
    const healthMeter = document.getElementById('healthMeter');
    
    if (!foodLayer || !countVal || !healthMeter) return;

    const count = foodLayer.children.length;
    countVal.textContent = count;
    
    const percentage = Math.min(100, (count / 8) * 100);
    healthMeter.style.width = percentage + '%';

    if (count >= 8 && !hasUnlockedGame) {
        hasUnlockedGame = true;
        setTimeout(openAchievementModal, 400);
    }
}

function openAchievementModal() {
    const modal = document.getElementById('achievementModal');
    if (modal) modal.classList.add('open');
}

function launchMemoryGame() {
    closeAllModals();
    goToScene('scene-game');
    initMemoryGame();      
}

function startMemoryFromMenu() {
    goToScene('scene-game');
    initMemoryGame();
}

function clearPlate() {
    const foodLayer = document.getElementById('foodLayer');
    if (foodLayer) {
        foodLayer.innerHTML = '';
        hasUnlockedGame = false;
        updateStats();
    }
}

function resetGame() {
    closeAllModals();
    clearPlate();
    goToScene('scene-build');
}

const gameFoodImages = ['strawberry.png', 'broccoli.png', 'banana.png', 'carrot.png', 'apple.png', 'mushroom.png'];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let isGameLocked = false;

function initMemoryGame() {
    closeAllModals();
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    matchedPairs = 0;
    flippedCards = [];
    isGameLocked = false;
    
    const selectedImages = [...gameFoodImages, ...gameFoodImages]
        .sort(() => Math.random() - 0.5)
        .map((src, index) => ({ id: index, src, isFlipped: false, isMatched: false }));
        
    memoryCards = selectedImages;
        
    memoryCards.forEach(cardData => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.dataset.id = cardData.id;
        
        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-back">🍃</div>
                <div class="card-front">
                    <img src="${cardData.src}" alt="Food item">
                </div>
            </div>
        `;
        
        cardElement.addEventListener('click', () => flipMemoryCard(cardData, cardElement));
        grid.appendChild(cardElement);
    });
}

function flipMemoryCard(cardData, element) {
    if (isGameLocked || cardData.isFlipped || cardData.isMatched) return;
    
    cardData.isFlipped = true;
    element.classList.add('flipped');
    
    flippedCards.push({ cardData, element });
    
    if (flippedCards.length === 2) {
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.cardData.src === card2.cardData.src) {
        card1.cardData.isMatched = true;
        card2.cardData.isMatched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        
        flippedCards = [];
        matchedPairs++;
        
        if (matchedPairs === 6) {
            setTimeout(() => {
                const winModal = document.getElementById('winModal');
                if (winModal) winModal.classList.add('open');
            }, 400);
        }
    } else {
        isGameLocked = true;
        setTimeout(() => {
            card1.cardData.isFlipped = false;
            card2.cardData.isFlipped = false;
            card1.element.classList.remove('flipped');
            card2.element.classList.remove('flipped');
            flippedCards = [];
            isGameLocked = false;
        }, 800);
    }
}

const sortItems = [
    { name: 'Apple', emoji: '🍎', type: 'fruit' },
    { name: 'Broccoli', emoji: '🥦', type: 'veggie' },
    { name: 'Banana', emoji: '🍌', type: 'fruit' },
    { name: 'Carrot', emoji: '🥕', type: 'veggie' },
    { name: 'Strawberry', emoji: '🍓', type: 'fruit' },
    { name: 'Mushroom', emoji: '🍄', type: 'veggie' },
    { name: 'Watermelon', emoji: '🍉', type: 'fruit' },
    { name: 'Lettuce', emoji: '🥬', type: 'veggie' }
];

let currentSortItem = null;
let sortScore = 0;

function startSortingGame() {
    closeAllModals();
    goToScene('scene-sorting');
    sortScore = 0;
    nextSortItem();
}

function nextSortItem() {
    currentSortItem = sortItems[Math.floor(Math.random() * sortItems.length)];
    document.getElementById('sortItemDisplay').textContent = currentSortItem.emoji;
    document.getElementById('sortItemName').textContent = currentSortItem.name;
    document.getElementById('sortScoreText').textContent = `Score: ${sortScore} / 10`;
}

function checkSort(chosenType) {
    if (chosenType === currentSortItem.type) {
        sortScore += 1;
        if (sortScore >= 10) {
            document.getElementById('sortWinModal').classList.add('open');
        } else {
            nextSortItem();
        }
    } else {
        document.getElementById('sortWrongText').textContent = `Oops! ${currentSortItem.name} is actually a ${currentSortItem.type}!`;
        document.getElementById('sortWrongModal').classList.add('open');
    }
}

function closeSortWrongModal() {
    document.getElementById('sortWrongModal').classList.remove('open');
    nextSortItem();
}

let catchScore = 0;
let itemSpawnInterval = null;
const catchEmojis = ['🍎', '🍌', '🍓', '🥦', '🥕', '🍉'];
let basketX = 50;
let isCatchActive = false;

function startCatchGame() {
    closeAllModals();
    goToScene('scene-catch');
    catchScore = 0;
    basketX = 50;
    isCatchActive = true;
    document.getElementById('catchScoreText').textContent = `Score: ${catchScore} / 20`;
    
    document.querySelectorAll('.falling-item').forEach(el => el.remove());

    const arena = document.getElementById('catchArena');
    
    arena.onmousemove = (e) => {
        if (!isCatchActive) return;
        const rect = arena.getBoundingClientRect();
        const x = e.clientX - rect.left;
        basketX = Math.max(10, Math.min(90, (x / rect.width) * 100));
        document.getElementById('playerBasket').style.left = basketX + '%';
    };

    arena.ontouchmove = (e) => {
        if (!isCatchActive) return;
        const rect = arena.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        basketX = Math.max(10, Math.min(90, (x / rect.width) * 100));
        document.getElementById('playerBasket').style.left = basketX + '%';
        e.preventDefault();
    };

    if (itemSpawnInterval) clearInterval(itemSpawnInterval);
    itemSpawnInterval = setInterval(spawnFallingItem, 900);
}

function spawnFallingItem() {
    const arena = document.getElementById('catchArena');
    if (!arena || !isCatchActive || document.getElementById('scene-catch').classList.contains('active') === false) {
        clearInterval(itemSpawnInterval);
        return;
    }

    const item = document.createElement('div');
    item.className = 'falling-item';
    item.textContent = catchEmojis[Math.floor(Math.random() * catchEmojis.length)];
    
    const randomLeft = Math.floor(Math.random() * 80) + 10;
    item.style.left = randomLeft + '%';
    
    arena.appendChild(item);

    const checkInterval = setInterval(() => {
        if (!isCatchActive) {
            clearInterval(checkInterval);
            return;
        }

        const itemRect = item.getBoundingClientRect();
        const basketEl = document.getElementById('playerBasket');
        const arenaRect = arena.getBoundingClientRect();
        
        if (!basketEl) {
            clearInterval(checkInterval);
            return;
        }
        const basketRect = basketEl.getBoundingClientRect();

        if (
            itemRect.bottom >= basketRect.top &&
            itemRect.top <= basketRect.bottom &&
            itemRect.right >= basketRect.left &&
            itemRect.left <= basketRect.right
        ) {
            catchScore += 1;
            document.getElementById('catchScoreText').textContent = `Score: ${catchScore} / 20`;
            item.remove();
            clearInterval(checkInterval);

            if (catchScore >= 20) {
                isCatchActive = false;
                clearInterval(itemSpawnInterval);
                document.querySelectorAll('.falling-item').forEach(el => el.remove());
                document.getElementById('catchWinModal').classList.add('open');
            }
            return;
        }

        if (itemRect.bottom >= arenaRect.bottom - 10) {
            isCatchActive = false;
            clearInterval(itemSpawnInterval);
            document.querySelectorAll('.falling-item').forEach(el => el.remove());
            document.getElementById('catchFinalScoreText').textContent = `You scored ${catchScore}/20 before dropping a snack!`;
            document.getElementById('catchGameOverModal').classList.add('open');
            clearInterval(checkInterval);
        }
    }, 40);
}

function exitCatchGame() {
    isCatchActive = false;
    if (itemSpawnInterval) clearInterval(itemSpawnInterval);
    document.querySelectorAll('.falling-item').forEach(el => el.remove());
    goToScene('scene-menu');
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        goToScene('scene-menu');
    }, 2400);
});