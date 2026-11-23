(() => {
  const stage = document.getElementById("waifuStage");
  const canvas = document.getElementById("waifuCanvas");
  const status = document.getElementById("waifuStatus");
  const viewStatus = document.getElementById("waifuViewStatus");
  const nameLabel = document.getElementById("waifuCharacterName");
  const description = document.getElementById("waifuDescription");
  const finalState = document.getElementById("waifuFinalState");
  const finalTitle = document.getElementById("waifuFinalTitle");

  if (!window.THREE) {
    status.textContent = "Three.js tidak dapat dimuat. Periksa koneksi internet.";
    console.error("Galeri Waifu gagal: Three.js tidak tersedia.");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (error) {
    status.textContent = "Browser ini tidak mendukung tampilan 3D WebGL.";
    console.error("Galeri Waifu gagal membuat renderer WebGL:", error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0xf8fcff, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fcff);
  scene.fog = new THREE.Fog(0xf8fcff, 58, 112);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 130);
  const startCameraZ = 17;
  const endCameraZ = -48;
  camera.position.set(0, 0, startCameraZ);
  camera.lookAt(0, 0, startCameraZ - 15);

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  const galleryCards = [];
  const corridorElements = [];
  const lightStreaks = [];
  const imageUrls = [];
  const finalTitleText = "GLITCH & SCATTER";
  let typingTimer = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const galleryItems = [
    { src: "waifu-castorice.webp", title: "CASTORICE / HONKAI: STAR RAIL", collection: "castorice" },
    { src: "game-hsr.png", title: "HONKAI: STAR RAIL", collection: "castorice" },
    { src: "waifu-castorice-views.jpg", title: "CASTORICE / CHARACTER VIEWS", collection: "castorice" },
    { src: "game-genshin.png", title: "GENSHIN IMPACT", collection: "shared" },
    { src: "waifu-trailblazer.png", title: "TRAILBLAZER / HONKAI: STAR RAIL", collection: "shared" },
    { src: "game-wuwa.png", title: "WUTHERING WAVES", collection: "shared" },
    { src: "waifu-nte-views.jpg", title: "NEVERNESS TO EVERNESS / CHARACTER VIEWS", collection: "nte" },
    { src: "game-nte.png", title: "NEVERNESS TO EVERNESS", collection: "nte" },
    { src: "game-zzz.png", title: "ZENLESS ZONE ZERO", collection: "shared" },
    { src: "game-hi3.png", title: "HONKAI IMPACT 3RD", collection: "shared" },
    { src: "character-left.png", title: "CHARACTER ARCHIVE / 01", collection: "shared" },
    { src: "game-blue-archive.png", title: "BLUE ARCHIVE", collection: "shared" },
    { src: "character-right.png", title: "CHARACTER ARCHIVE / 02", collection: "shared" },
    { src: "game-strinova.png", title: "STRINOVA", collection: "shared" },
    { src: "game-hsr.png", title: "HONKAI: STAR RAIL / MEMORIES", collection: "castorice" },
    { src: "game-genshin.png", title: "GAMES / COMMUNITY ARCHIVE", collection: "shared" }
  ];

  const sequence = {
    state: "travel",
    elapsed: 0,
    duration: 9.2,
    collection: "all",
    active: false,
    rafId: 0,
    lastFrame: 0
  };

  function loadTexture(source) {
    if (textureCache.has(source)) return textureCache.get(source);
    const texturePromise = new Promise((resolve, reject) => {
      textureLoader.load(
        source,
        (texture) => {
          texture.encoding = THREE.sRGBEncoding;
          resolve(texture);
        },
        undefined,
        () => reject(new Error(`Gagal memuat gambar galeri: ${source}`))
      );
    });
    textureCache.set(source, texturePromise);
    return texturePromise;
  }

  function addCorridor() {
    const panelColors = [0xe8fbff, 0xf1edff, 0xffffff, 0xe7f7ff];
    const accentColors = [0x30cee9, 0xe85bbd, 0x3159e8, 0xb76be8];
    for (let index = 0; index < 17; index += 1) {
      const z = 10 - index * 7.8;
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(19, 10),
        new THREE.MeshBasicMaterial({
          color: panelColors[index % panelColors.length],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.18,
          depthWrite: false
        })
      );
      panel.position.set(0, 0, z - 1.65);
      scene.add(panel);
      corridorElements.push(panel);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(19, 10)),
        new THREE.LineBasicMaterial({ color: accentColors[index % accentColors.length], transparent: true, opacity: 0.28 })
      );
      edge.position.copy(panel.position);
      scene.add(edge);
      corridorElements.push(edge);

      for (let detail = 0; detail < 4; detail += 1) {
        const width = detail % 2 === 0 ? 1.6 : 0.7;
        const height = detail % 2 === 0 ? 0.08 : 0.34;
        const shape = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({
            color: accentColors[(index + detail) % accentColors.length],
            transparent: true,
            opacity: 0.68,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        shape.position.set(
          (detail % 2 === 0 ? -1 : 1) * (4 + Math.random() * 4),
          (Math.random() - 0.5) * 7.6,
          z - 1.55
        );
        shape.rotation.z = (Math.random() - 0.5) * 0.14;
        scene.add(shape);
        corridorElements.push(shape);
      }

      for (let streakIndex = 0; streakIndex < 6; streakIndex += 1) {
        const colors = [0x40cde8, 0x9b69e8, 0xe85bbd, 0x6577ef];
        const color = colors[(index + streakIndex) % colors.length];
        const length = 1.4 + Math.random() * 3.2;
        const width = 0.018 + Math.random() * 0.025;
        const streak = new THREE.Group();
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const coreMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * 5, length), glowMaterial);
        const core = new THREE.Mesh(new THREE.PlaneGeometry(width, length), coreMaterial);
        streak.add(glow, core);
        streak.position.set(
          (Math.random() - 0.5) * 17,
          4.7 - length / 2 + (Math.random() - 0.5) * 1.6,
          z - 1.48
        );
        streak.rotation.z = (Math.random() - 0.5) * 0.28;
        scene.add(streak);
        corridorElements.push(streak);
        lightStreaks.push({
          core: coreMaterial,
          glow: glowMaterial,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    const guideMaterial = new THREE.MeshBasicMaterial({ color: 0x49cde8, transparent: true, opacity: 0.48 });
    [-4.6, 4.6].forEach((x) => {
      const guide = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 116), guideMaterial);
      guide.rotation.x = Math.PI / 2;
      guide.position.set(x, -4.7, -34);
      scene.add(guide);
      corridorElements.push(guide);
    });
  }

  function makeCaptionTexture(title) {
    const captionCanvas = document.createElement("canvas");
    captionCanvas.width = 512;
    captionCanvas.height = 72;
    const context = captionCanvas.getContext("2d");
    context.fillStyle = "rgba(255,255,255,0.96)";
    context.fillRect(0, 0, captionCanvas.width, captionCanvas.height);
    context.fillStyle = "#25375f";
    context.font = "700 20px Arial, sans-serif";
    context.textBaseline = "middle";
    context.fillText(title.slice(0, 34), 22, 38);
    const texture = new THREE.CanvasTexture(captionCanvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function makeCard(item, texture, index) {
    const image = texture.image;
    const aspect = image.width / image.height;
    const width = Math.min(3.35, 2.28 * aspect);
    const height = width / aspect;
    const group = new THREE.Group();
    const accent = [0x2d56ed, 0xec58b8, 0x30cce7, 0x9b58df][index % 4];

    const backplate = new THREE.Mesh(
      new THREE.PlaneGeometry(width + 0.22, height + 0.24),
      new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide })
    );
    backplate.position.set(index % 2 === 0 ? 0.1 : -0.1, -0.1, -0.04);
    group.add(backplate);

    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    picture.position.z = 0.02;
    group.add(picture);

    const caption = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.27),
      new THREE.MeshBasicMaterial({ map: makeCaptionTexture(item.title), transparent: true, side: THREE.DoubleSide })
    );
    caption.position.set(0, -height / 2 - 0.15, 0.04);
    group.add(caption);

    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.2, 0.07),
      new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide })
    );
    marker.position.set(-width * 0.36, height / 2 + 0.12, 0.03);
    group.add(marker);

    const row = Math.floor(index / 2);
    const side = index % 2 === 0 ? -1 : 1;
    const basePosition = new THREE.Vector3(
      side * (2.35 + Math.random() * 0.85),
      (row % 3 - 1) * 1.15 + (Math.random() - 0.5) * 0.55,
      9 - row * 7.8
    );
    const baseRotation = new THREE.Euler(
      (Math.random() - 0.5) * 0.08,
      side < 0 ? 0.24 : -0.24,
      (Math.random() - 0.5) * 0.08
    );
    group.position.copy(basePosition);
    group.rotation.copy(baseRotation);
    group.userData.item = item;
    group.userData.basePosition = basePosition;
    group.userData.baseRotation = baseRotation.clone();
    group.userData.materials = [backplate.material, picture.material, caption.material, marker.material];
    group.userData.scatterTarget = new THREE.Vector3();
    scene.add(group);
    galleryCards.push(group);
    return group;
  }

  function makeScatterField() {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xec58b8),
      new THREE.Color(0x35cde8),
      new THREE.Color(0x3c5fe7),
      new THREE.Color(0xb66be5)
    ];

    for (let index = 0; index < count; index += 1) {
      const color = palette[index % palette.length];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 32;
    glowCanvas.height = 32;
    const context = glowCanvas.getContext("2d");
    const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.24, "rgba(255,255,255,0.92)");
    glow.addColorStop(0.62, "rgba(255,255,255,0.28)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 32, 32);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.userData.targets = targets;
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: glowTexture,
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      })
    );
    points.visible = false;
    scene.add(points);
    return points;
  }

  function visibleCards() {
    return galleryCards.filter((group) => group.visible);
  }

  function setCollection(collection) {
    sequence.collection = collection;
    galleryCards.forEach((group) => {
      group.visible = collection === "all" || group.userData.item.collection === "shared" || group.userData.item.collection === collection;
    });
    const labels = { castorice: "Castorice", nte: "NTE Character", all: "Semua Galeri" };
    nameLabel.textContent = collection === "all" ? "MULTIVERSE / ALL CHARACTERS" : labels[collection].toUpperCase();
    description.textContent = collection === "all"
      ? "Karakter, dunia game, dan fragmen memori dalam lorong 3D."
      : `Arsip visual ${labels[collection]} dalam perjalanan galeri 3D.`;
    document.getElementById("waifuCastoriceBtn").classList.toggle("active", collection === "castorice");
    document.getElementById("waifuTrailblazerBtn").classList.toggle("active", collection === "nte");
    document.getElementById("waifuBothBtn").classList.toggle("active", collection === "all");
    document.getElementById("waifuBothBtn").setAttribute("aria-pressed", String(collection === "all"));
    resetSequence();
  }

  function resetSequence() {
    window.clearInterval(typingTimer);
    typingTimer = 0;
    finalTitle.textContent = "";
    sequence.state = "travel";
    sequence.elapsed = 0;
    camera.position.set(0, 0, startCameraZ);
    pointer.targetX = 0;
    pointer.targetY = 0;
    stage.classList.remove("is-glitching", "is-scattering", "is-final");
    finalState.setAttribute("aria-hidden", "true");
    scatterField.visible = false;
    scatterField.material.opacity = 0;
    corridorElements.forEach((element) => { element.visible = true; });
    galleryCards.forEach((group) => {
      group.position.copy(group.userData.basePosition);
      group.rotation.copy(group.userData.baseRotation);
      group.userData.materials.forEach((material) => { material.opacity = 1; });
      group.visible = sequence.collection === "all" ||
        group.userData.item.collection === "shared" ||
        group.userData.item.collection === sequence.collection;
    });
    viewStatus.textContent = "● SYSTEM ONLINE / 3D GALLERY";
    status.textContent = `${visibleCards().length} KARTU VISUAL / LORONG AKTIF`;
  }

  function startGlitch() {
    if (!galleryCards.length) {
      status.textContent = "Galeri belum selesai dimuat.";
      return;
    }
    window.clearInterval(typingTimer);
    typingTimer = 0;
    finalTitle.textContent = "";
    sequence.state = "glitch";
    sequence.elapsed = 0;
    stage.classList.remove("is-final", "is-scattering");
    stage.classList.add("is-glitching");
    finalState.setAttribute("aria-hidden", "true");
    viewStatus.textContent = "◉ SIGNAL INSTABILITY";
    status.textContent = "GLITCH DETECTED / MENYIAPKAN FRAGMEN...";
  }

  function startScatter() {
    sequence.state = "scatter";
    sequence.elapsed = 0;
    stage.classList.remove("is-glitching");
    stage.classList.add("is-scattering");
    corridorElements.forEach((element) => { element.visible = false; });
    const cardList = visibleCards();
    cardList.forEach((group) => {
      group.userData.scatterStart = group.position.clone();
      group.userData.scatterTarget.set(
        camera.position.x + (Math.random() - 0.5) * 26,
        camera.position.y + (Math.random() - 0.5) * 17,
        camera.position.z - 5 - Math.random() * 28
      );
    });

    const positions = scatterField.geometry.attributes.position.array;
    const targets = scatterField.geometry.userData.targets;
    for (let index = 0; index < positions.length; index += 3) {
      const depth = 11 + Math.random() * 22;
      const halfHeight = depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      positions[index] = camera.position.x + (Math.random() - 0.5) * 3;
      positions[index + 1] = camera.position.y + (Math.random() - 0.5) * 2;
      positions[index + 2] = camera.position.z - 11 - Math.random() * 3;
      targets[index] = camera.position.x + (Math.random() - 0.5) * halfHeight * camera.aspect * 1.65;
      targets[index + 1] = camera.position.y + (Math.random() - 0.5) * halfHeight * 1.65;
      targets[index + 2] = camera.position.z - depth;
    }
    scatterField.geometry.attributes.position.needsUpdate = true;
    scatterField.material.opacity = 0.9;
    scatterField.visible = true;
    viewStatus.textContent = "◉ MEMORY FRAGMENTS / SCATTER";
    status.textContent = "SEMUA FRAGMEN MENYEBAR KE RUANG 3D";
  }

  function finishSequence() {
    sequence.state = "complete";
    stage.classList.remove("is-scattering");
    stage.classList.add("is-final");
    finalState.setAttribute("aria-hidden", "false");
    let characterIndex = 0;
    typingTimer = window.setInterval(() => {
      characterIndex += 1;
      finalTitle.textContent = finalTitleText.slice(0, characterIndex);
      if (characterIndex >= finalTitleText.length) {
        window.clearInterval(typingTimer);
        typingTimer = 0;
      }
    }, 75);
    viewStatus.textContent = "● SIGNAL LOST / ARCHIVE FRAGMENTED";
    status.textContent = "GLITCH SELESAI / TEKAN PUTAR ULANG UNTUK MENJELAJAHI KEMBALI";
  }

  function setActive(active) {
    sequence.active = active;
    if (active && !sequence.rafId) {
      sequence.lastFrame = performance.now();
      sequence.rafId = window.requestAnimationFrame(renderFrame);
    } else if (!active && sequence.rafId) {
      window.cancelAnimationFrame(sequence.rafId);
      sequence.rafId = 0;
    }
  }

  function renderFrame(now) {
    if (!sequence.active) {
      sequence.rafId = 0;
      return;
    }
    const delta = Math.min((now - sequence.lastFrame) / 1000, 0.05);
    sequence.lastFrame = now;
    sequence.elapsed += delta;
    pointer.x += (pointer.targetX - pointer.x) * (1 - Math.exp(-delta * 5));
    pointer.y += (pointer.targetY - pointer.y) * (1 - Math.exp(-delta * 5));
    lightStreaks.forEach((streak) => {
      const pulse = 0.78 + Math.sin(now * 0.002 + streak.phase) * 0.22;
      streak.core.opacity = 0.58 + pulse * 0.16;
      streak.glow.opacity = 0.09 + pulse * 0.1;
    });

    if (sequence.state === "travel") {
      const progress = Math.min(sequence.elapsed / sequence.duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.z = startCameraZ + (endCameraZ - startCameraZ) * eased;
      camera.position.x = Math.sin(progress * Math.PI * 2) * 0.48 + pointer.x * 0.65;
      camera.position.y = Math.sin(progress * Math.PI * 3) * 0.12 - pointer.y * 0.3;
      camera.lookAt(camera.position.x * 0.2, camera.position.y * 0.25, camera.position.z - 15);
      if (progress >= 1) startGlitch();
    } else if (sequence.state === "glitch") {
      galleryCards.forEach((group) => {
        if (!group.visible) return;
        group.position.x = group.userData.basePosition.x + (Math.random() - 0.5) * 0.2;
        group.position.y = group.userData.basePosition.y + (Math.random() - 0.5) * 0.12;
        group.rotation.z = group.userData.baseRotation.z + (Math.random() - 0.5) * 0.05;
      });
      if (sequence.elapsed >= 0.72) startScatter();
    } else if (sequence.state === "scatter") {
      const progress = Math.min(sequence.elapsed / 1.35, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      visibleCards().forEach((group) => {
        group.position.lerpVectors(group.userData.scatterStart, group.userData.scatterTarget, eased);
        group.rotation.z = group.userData.baseRotation.z + eased * (group.userData.scatterTarget.x < camera.position.x ? -1 : 1) * 0.8;
        group.userData.materials.forEach((material) => { material.opacity = 1 - eased * 0.82; });
      });

      const positions = scatterField.geometry.attributes.position.array;
      const targets = scatterField.geometry.userData.targets;
      for (let index = 0; index < positions.length; index += 1) {
        const point = Math.floor(index / 3) * 3;
        positions[index] += (targets[index] - positions[index]) * (1 - Math.exp(-delta * 3.1));
      }
      scatterField.geometry.attributes.position.needsUpdate = true;
      scatterField.material.opacity = Math.max(0.25, 0.9 - progress * 0.55);
      camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 14);
      if (progress >= 1) finishSequence();
    }

    renderer.render(scene, camera);
    sequence.rafId = window.requestAnimationFrame(renderFrame);
  }

  function resizeRenderer() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function updateCollectionButton(event, collection) {
    event.preventDefault();
    setCollection(collection);
  }

  document.getElementById("waifuCastoriceBtn").addEventListener("click", (event) => updateCollectionButton(event, "castorice"));
  document.getElementById("waifuTrailblazerBtn").addEventListener("click", (event) => updateCollectionButton(event, "nte"));
  document.getElementById("waifuBothBtn").addEventListener("click", (event) => updateCollectionButton(event, "all"));
  document.getElementById("waifuBuildBtn").addEventListener("click", resetSequence);
  document.getElementById("waifuScatterBtn").addEventListener("click", startGlitch);

  document.getElementById("waifuImageUpload").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const source = URL.createObjectURL(file);
    imageUrls.push(source);
    status.textContent = "MENAMBAHKAN GAMBAR KE GALERI...";
    try {
      const texture = await loadTexture(source);
      const item = { src: source, title: file.name.replace(/\.[^.]+$/, "").toUpperCase(), collection: "shared" };
      makeCard(item, texture, galleryCards.length);
      setCollection(sequence.collection);
    } catch (error) {
      status.textContent = error.message;
      console.error("Upload galeri gagal:", error);
    }
  });

  stage.addEventListener("pointermove", (event) => {
    const bounds = stage.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 1.2;
    pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.8;
  });
  stage.addEventListener("pointerleave", () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  });
  window.addEventListener("beforeunload", () => imageUrls.forEach((url) => URL.revokeObjectURL(url)));
  window.addEventListener("resize", resizeRenderer);

  const scatterField = makeScatterField();
  addCorridor();
  resizeRenderer();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      setActive(entry.isIntersecting);
    }
  }, { threshold: 0.12 });
  observer.observe(stage);

  Promise.all(galleryItems.map(async (item, index) => {
    const texture = await loadTexture(item.src);
    return makeCard(item, texture, index);
  }))
    .then(() => {
      setCollection("all");
      status.textContent = `${visibleCards().length} KARTU VISUAL / LORONG 3D SIAP`;
    })
    .catch((error) => {
      status.textContent = error.message;
      console.error("Galeri Waifu gagal disiapkan:", error);
    });
})();
