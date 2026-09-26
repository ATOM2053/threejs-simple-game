const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// แสงสว่าง
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

let characterModel;
let mixer;
const clock = new THREE.Clock();
const loader = new THREE.GLTFLoader();

// สถานะการกดปุ่ม
const moveState = { forward: false, backward: false, left: false, right: false };

// เก็บข้อมูลตัวละครของผู้เล่นคนอื่นๆ ที่เข้ามาในห้อง
const otherPlayers = {};

// 🔗 เชื่อมต่อไปยังเซิร์ฟเวอร์ (เปลี่ยน URL นี้เป็นลิงก์ Render ของคุณตอม)
const SERVER_URL = 'https://ชื่อ-เซิร์ฟเวอร์ของคุณ.onrender.com';
const socket = io(SERVER_URL);

// 1. โหลดโมเดลเมือง
loader.load(
    'https://github.com/ATOM2053/threejs-simple-game/releases/download/v1.0.0/city.glb',
    function (gltf) {
        scene.add(gltf.scene);
    }
);

// 2. โหลดโมเดลตัวละครหลักของเรา
loader.load(
    'https://github.com/ATOM2053/threejs-simple-game/releases/download/v1.0.0/robot_police_unit_animated.1.glb',
    function (gltf) {
        characterModel = gltf.scene;
        characterModel.scale.set(1, 1, 1);
        characterModel.position.set(0, 0, 0);
        scene.add(characterModel);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(characterModel);
            mixer.clipAction(gltf.animations[0]).play();
        }
    }
);

// --- ระบบ Socket.io จัดการผู้เล่นหลายคน ---
socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
        if (id !== socket.id) {
            createOtherPlayer(id, players[id]);
        }
    });
});

socket.on('newPlayer', (data) => {
    createOtherPlayer(data.id, data.player);
});

socket.on('playerMoved', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].position.set(data.player.x, data.player.y, data.player.z);
        otherPlayers[data.id].rotation.y = data.player.rotation;
    }
});

socket.on('disconnectPlayer', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

function createOtherPlayer(id, playerData) {
    loader.load(
        'https://github.com/ATOM2053/threejs-simple-game/releases/download/v1.0.0/robot_police_unit_animated.1.glb',
        function (gltf) {
            const pModel = gltf.scene;
            pModel.scale.set(1, 1, 1);
            pModel.position.set(playerData.x, playerData.y, playerData.z);
            scene.add(pModel);
            otherPlayers[id] = pModel;
        }
    );
}

// ควบคุมปุ่มเดิน
function bindButton(id, stateKey) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('mousedown', () => moveState[stateKey] = true);
    btn.addEventListener('mouseup', () => moveState[stateKey] = false);
    btn.addEventListener('mouseleave', () => moveState[stateKey] = false);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); moveState[stateKey] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); moveState[stateKey] = false; });
}

bindButton('btn-up', 'forward');
bindButton('btn-down', 'backward');
bindButton('btn-left', 'left');
bindButton('btn-right', 'right');

// ปุ่มแอคชันพิเศษ
document.getElementById('btn-attack').addEventListener('click', () => {
    console.log("โจมตี!");
});
document.getElementById('btn-collect').addEventListener('click', () => {
    console.log("เก็บของ!");
});

// ลูปเกมและการส่งข้อมูลพิกัด
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (characterModel) {
        const speed = 0.1;
        let moved = false;

        if (moveState.forward) { characterModel.position.z -= speed; characterModel.rotation.y = Math.PI; moved = true; }
        if (moveState.backward) { characterModel.position.z += speed; characterModel.rotation.y = 0; moved = true; }
        if (moveState.left) { characterModel.position.x -= speed; characterModel.rotation.y = -Math.PI / 2; moved = true; }
        if (moveState.right) { characterModel.position.x += speed; characterModel.rotation.y = Math.PI / 2; moved = true; }

        // ส่งพิกัดตำแหน่งตัวเองบอกเซิร์ฟเวอร์
        if (moved) {
            socket.emit('playerMovement', {
                x: characterModel.position.x,
                y: characterModel.position.y,
                z: characterModel.position.z,
                rotation: characterModel.rotation.y
            });
        }

        // กล้องตามติดตัวละคร
        camera.position.x = characterModel.position.x;
        camera.position.z = characterModel.position.z + 10;
        camera.lookAt(characterModel.position);
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
