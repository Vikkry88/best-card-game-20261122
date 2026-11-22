// Particles and floating numbers: hit bursts, shield sparkles and victory confetti.
// Purely visual; the world never reads this back.

export function createFx(random) {
  const particles = [];
  const floaters = [];

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const velocity = (0.3 + random() * 0.7) * speed;
      particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 40,
        life: 0.5 + random() * 0.5,
        maxLife: 1,
        color,
        size: 3 + random() * 5,
        gravity: 220,
      });
    }
  }

  function confetti(width) {
    const colors = ['#ff5a4e', '#3fa9f5', '#51d88a', '#b78bff', '#f2c94c'];
    for (let i = 0; i < 90; i += 1) {
      particles.push({
        x: random() * width,
        y: -20 - random() * 180,
        vx: (random() - 0.5) * 60,
        vy: 90 + random() * 130,
        life: 2.2 + random() * 1.4,
        maxLife: 3.6,
        color: colors[i % colors.length],
        size: 5 + random() * 6,
        gravity: 30,
      });
    }
  }

  function floater(x, y, text, color) {
    floaters.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }

  function step(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      if (particle.life <= 0) { particles.splice(i, 1); continue; }
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const item = floaters[i];
      item.life -= dt;
      item.y -= 42 * dt;
      if (item.life <= 0) floaters.splice(i, 1);
    }
  }

  function draw(context) {
    for (const particle of particles) {
      context.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      context.fillStyle = particle.color;
      context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    context.globalAlpha = 1;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (const item of floaters) {
      context.globalAlpha = Math.max(0, Math.min(1, item.life / item.maxLife));
      context.font = 'bold 30px system-ui, sans-serif';
      context.fillStyle = item.color;
      context.fillText(item.text, item.x, item.y);
    }
    context.globalAlpha = 1;
  }

  function clear() {
    particles.length = 0;
    floaters.length = 0;
  }

  return { burst, confetti, floater, step, draw, clear };
}
