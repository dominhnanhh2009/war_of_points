for (let i = 0; i < 20; i++) units.push(U("soldier", 0, -60 + Math.random() * 20, (Math.random() - .5) * 50));
for (let i = 0; i < 20; i++) units.push(U("soldier", 1, 60 + Math.random() * 20, (Math.random() - .5) * 50));

let last = performance.now();
(function loop(t) {
    let dt = (t - last) / 1000;
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
})(last);
