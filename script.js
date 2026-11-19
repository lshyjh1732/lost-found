
// 시연용 관리자 비밀번호
const DEMO_ADMIN_PASSWORD = "1234";

// 데이터 가져오기 및 저장하기
function getItems() {
    try {
        return JSON.parse(localStorage.getItem("lostItems")) || [];
    } catch {
        return [];
    }
}

function saveItems(items) {
    localStorage.setItem("lostItems", JSON.stringify(items));
}

// 관리자 로그인 상태
function isAdminLoggedIn() {
    return sessionStorage.getItem("adminLoggedIn") === "true";
}

// HTML 요소 생성
function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

// 상단 메뉴
const menuButton = document.getElementById("menuButton");
const dropdownMenu = document.getElementById("dropdownMenu");

if (menuButton && dropdownMenu) {
    menuButton.addEventListener("click", function(event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", function(event) {
        if (!event.target.closest(".menu-container")) {
            dropdownMenu.classList.remove("show");
        }
    });
}

// 분실물 등록
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("itemName").value.trim();
        const imageFile = document.getElementById("itemImage").files[0];
        const finder = document.getElementById("finder").value.trim();
        const foundLocation = document.getElementById("foundLocation").value.trim();
        const storageLocation = document.getElementById("storageLocation").value.trim();
        const contact = document.getElementById("contact").value.trim();

        if (!/^010-[0-9]{4}-[0-9]{4}$/.test(contact)) {
            alert("연락처를 010-1234-5678 형식으로 입력해 주세요.");
            return;
        }

        if (!imageFile || !imageFile.type.startsWith("image/")) {
            alert("이미지 파일을 선택해 주세요.");
            return;
        }

        if (imageFile.size > 2 * 1024 * 1024) {
            alert("사진은 2MB 이하로 등록해 주세요.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function() {
            const items = getItems();

            items.push({
                id: Date.now(),
                name: name,
                image: reader.result,
                finder: finder,
                foundLocation: foundLocation,
                storageLocation: storageLocation,
                contact: contact,
                date: new Date().toLocaleDateString("ko-KR"),
                status: "보관 중"
            });

            try {
                saveItems(items);
                alert("분실물이 등록되었습니다.");
                window.location.href = "find.html";
            } catch {
                alert("저장 공간이 부족합니다. 사진 용량을 줄여 다시 시도해 주세요.");
            }
        };

        reader.readAsDataURL(imageFile);
    });
}

// 상태 표시 만들기
function createStatus(item) {
    return createElement(
        "span",
        item.status === "찾아감"
            ? "status status-found"
            : "status status-waiting",
        item.status === "찾아감" ? "찾아감" : "보관 중"
    );
}

// 분실물 카드 만들기
function createItemCard(item, adminMode = false) {
    const card = createElement("div", "lost-item-card");

    const image = createElement("img");
    image.src = item.image;
    image.alt = "분실물 사진";

    const textBox = createElement("div", "item-card-text");

    const title = createElement("h3", "", item.name);
    const found = createElement("p", "", "발견 위치: " + item.foundLocation);
    const storage = createElement("p", "", "보관 장소: " + item.storageLocation);

    textBox.append(title, found, storage, createStatus(item));

    card.append(image, textBox);

    // 관리자 페이지에서만 자세히 보기 버튼 표시
    if (adminMode) {
        const detailButton = createElement(
            "button",
            "detail-button",
            "자세히 보기"
        );

        detailButton.addEventListener("click", function() {
            showItemDetail(item.id, card);
        });

        textBox.appendChild(detailButton);
    }

    return card;
}

// 분실물 검색 및 일반 목록 표시
const itemList = document.getElementById("itemList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

function displayItems(keyword = "") {
    if (!itemList) return;

    const items = getItems();

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(keyword.toLowerCase())
    );

    itemList.innerHTML = "";

    if (filteredItems.length === 0) {
        itemList.appendChild(
            createElement("p", "form-description", "등록된 분실물이 없습니다.")
        );
        return;
    }

    filteredItems.forEach(item => {
        // 일반 페이지에는 관리자 기능을 절대 표시하지 않음
        itemList.appendChild(createItemCard(item, false));
    });
}

// 검색 버튼
if (searchButton && searchInput) {
    searchButton.addEventListener("click", function() {
        displayItems(searchInput.value.trim());
    });

    searchInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            displayItems(searchInput.value.trim());
        }
    });
}

// 일반 분실물 페이지 최초 표시
if (itemList) {
    displayItems();
}

// 관리자 자세히 보기
function showItemDetail(id, card) {
    if (!isAdminLoggedIn()) {
        alert("관리자 로그인이 필요합니다.");
        return;
    }

    const items = getItems();
    const item = items.find(item => item.id === id);

    if (!item) return;

    // 이미 열린 상세 정보가 있다면 닫기
    const oldDetail = card.nextElementSibling;

    if (oldDetail && oldDetail.classList.contains("detail-box")) {
        oldDetail.remove();
        return;
    }

    const detail = createElement("div", "detail-box");

    const heading = createElement("h3", "", "물품 상세 정보");
    const finder = createElement("p", "", "발견자 이름: " + item.finder);
    const contact = createElement("p", "", "연락처: " + item.contact);
    const date = createElement("p", "", "등록일: " + item.date);

    const status = createElement(
        "p",
        "",
        "현재 상태: " + (item.status || "보관 중")
    );

    const actions = createElement("div", "detail-actions");

    // 찾아감 처리 및 취소 버튼
    const statusButton = createElement(
        "button",
        item.status === "찾아감"
            ? "cancel-found-button"
            : "found-button",
        item.status === "찾아감"
            ? "찾아감 취소"
            : "찾아감 처리"
    );

    statusButton.addEventListener("click", function() {
        changeItemStatus(item.id);
    });

    // 삭제 버튼
    const deleteButton = createElement(
        "button",
        "delete-button",
        "삭제하기"
    );

    deleteButton.addEventListener("click", function() {
        deleteItem(item.id);
    });

    actions.append(statusButton, deleteButton);

    detail.append(
        heading,
        finder,
        contact,
        date,
        status,
        actions
    );

    card.insertAdjacentElement("afterend", detail);
}

// 물품 상태 변경
function changeItemStatus(id) {
    if (!isAdminLoggedIn()) {
        alert("관리자만 변경할 수 있습니다.");
        return;
    }

    const items = getItems();
    const item = items.find(item => item.id === id);

    if (!item) return;

    item.status = item.status === "찾아감"
        ? "보관 중"
        : "찾아감";

    saveItems(items);

    alert(
        item.status === "찾아감"
            ? "찾아감으로 표시했습니다."
            : "보관 중으로 변경했습니다."
    );

    refreshLists();
}

// 물품 삭제
function deleteItem(id) {
    if (!isAdminLoggedIn()) {
        alert("관리자만 삭제할 수 있습니다.");
        return;
    }

    if (!confirm("이 분실물을 삭제하시겠습니까?")) {
        return;
    }

    const items = getItems();
    const updatedItems = items.filter(item => item.id !== id);

    saveItems(updatedItems);

    alert("분실물이 삭제되었습니다.");

    refreshLists();
}

// 목록 새로고침
function refreshLists() {
    if (itemList) {
        displayItems(searchInput ? searchInput.value.trim() : "");
    }

    if (document.getElementById("adminItemList")) {
        displayAdminItems();
    }
}

// 관리자 로그인
const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const password = document.getElementById("adminPassword").value;

        if (password === DEMO_ADMIN_PASSWORD) {
            sessionStorage.setItem("adminLoggedIn", "true");

            alert("관리자 로그인에 성공했습니다.");

            showAdminPanel();
        } else {
            alert("비밀번호가 올바르지 않습니다.");
        }
    });
}

// 관리자 화면 표시
function showAdminPanel() {
    if (!isAdminLoggedIn()) return;

    const login = document.getElementById("adminLogin");
    const panel = document.getElementById("adminPanel");

    if (!login || !panel) return;

    login.hidden = true;
    panel.hidden = false;

    displayAdminItems();
}

// 관리자 전용 분실물 목록
function displayAdminItems() {
    const adminItemList = document.getElementById("adminItemList");

    if (!adminItemList) return;

    // 관리자 로그인 전에는 목록을 표시하지 않음
    if (!isAdminLoggedIn()) {
        adminItemList.innerHTML = "";
        return;
    }

    adminItemList.innerHTML = "";

    const items = getItems();

    if (items.length === 0) {
        adminItemList.appendChild(
            createElement("p", "form-description", "등록된 분실물이 없습니다.")
        );
        return;
    }

    items.forEach(item => {
        // 관리자 페이지에서만 관리 기능 표시
        adminItemList.appendChild(createItemCard(item, true));
    });
}

// 관리자 페이지 로그인 상태 확인
if (document.getElementById("adminLogin")) {
    if (isAdminLoggedIn()) {
        showAdminPanel();
    }
}

// 로그아웃
const adminLogout = document.getElementById("adminLogout");

if (adminLogout) {
    adminLogout.addEventListener("click", function() {
        sessionStorage.removeItem("adminLoggedIn");

        alert("로그아웃되었습니다.");

        window.location.reload();
    });
}
