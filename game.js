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

// 1. โหลดโมเดลเมืองตามลิงก์ของคุณตอม
loader.load(
    'https://github.com/ATOM2053/threejs-simple-game/releases/download/v1.0.0/city.glb',
    function (gltf) {
        scene.add(gltf.scene);
        console.log("โหลดเมืองสำเร็จ!");
    },
    undefined,
    (err) => console.error("โหลดเมืองไม่สำเร็จ:", err)
);

// 2. โหลดโมเดลตัวละครตามลิงก์ของคุณตอม
loader.load(
    'https://github.com/ATOM2053/threejs-simple-game/releases/download/v1.0.0/robot_police_unit_animated.1.glb',
    function (gltf) {
        characterModel = gltf.scene;
        characterModel.scale.set(1, 1, 1);
        characterModel.position.set(0, 0, 0);
        scene.add(characterModel);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(characterModel);
            mixer.clipAction(gltf.animations[0]).play(); // เล่นแอนิเมชันเริ่มต้น
        }
        console.log("โหลดตัวละครสำเร็จ!");
    },
    undefined,
    (err) => console.error("โหลดตัวละครไม่สำเร็จ:", err)
);

// ฟังก์ชันผูกปุ่มเดิน
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

// ฟังก์ชันปุ่มแอคชันพิเศษ (ตี / เก็บของ)
document.getElementById('btn-attack').addEventListener('click', () => {
    console.log("ตัวละครทำการโจมตี (Attack)!");
});

document.getElementById('btn-collect').addEventListener('click', () => {
    console.log("ตัวละครทำการเก็บไอเทม (Collect)!");
});

// ลูปเคลื่อนที่และเรนเดอร์เกม
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (characterModel) {
        const speed = 0.1;

        if (moveState.forward) {
            characterModel.position.z -= speed;
            characterModel.rotation.y = Math.PI;
        }
        if (moveState.backward) {
            characterModel.position.z += speed;
            characterModel.rotation.y = 0;
        }
        if (moveState.left) {
            characterModel.position.x -= speed;
            characterModel.rotation.y = -Math.PI / 2;
        }
        if (moveState.right) {
            characterModel.position.x += speed;
            characterModel.rotation.y = Math.PI / 2;
        }

        // กล้องเคลื่อนที่ตามติดตัวละคร (Third-person view)
        camera.position.x = characterModel.position.x;
        camera.position.z = characterModel.position.z + 10;
        camera.lookAt(characterModel.position);
    }

    renderer.render(scene, camera);
}
animate();

// ปรับขนาดหน้าจออัตโนมัติ
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

