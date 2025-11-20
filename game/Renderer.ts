import { TILE_SIZE, COLORS, TileType, EntityType } from "../constants";
import { Entity, Vector2 } from "../types";

// A helper to generate sprite sheets programmatically so we don't rely on external assets
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: Map<string, HTMLCanvasElement> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.initSprites();
  }

  private createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  private initSprites() {
    // 1. GROUND
    const ground = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const gCtx = ground.getContext('2d')!;
    gCtx.fillStyle = COLORS.ground;
    gCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gCtx.fillStyle = '#F8B800'; // Highlight
    gCtx.fillRect(0, 0, TILE_SIZE, 2); // Top lip
    gCtx.fillStyle = '#000000';
    gCtx.globalAlpha = 0.2;
    gCtx.fillRect(0, 4, TILE_SIZE, 1); // Texture
    gCtx.fillRect(4, 8, TILE_SIZE-4, 1); // Texture
    this.sprites.set('ground', ground);

    // 2. BRICK
    const brick = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const bCtx = brick.getContext('2d')!;
    bCtx.fillStyle = COLORS.brick;
    bCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    bCtx.fillStyle = '#000'; // Mortar
    bCtx.fillRect(0, 0, TILE_SIZE, 1);
    bCtx.fillRect(0, 8, TILE_SIZE, 1);
    bCtx.fillRect(8, 0, 1, 8);
    bCtx.fillRect(4, 8, 1, 8);
    bCtx.fillRect(12, 8, 1, 8);
    this.sprites.set('brick', brick);

    // 3. QUESTION BLOCK
    const qBlock = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const qCtx = qBlock.getContext('2d')!;
    qCtx.fillStyle = '#F89800'; // Gold
    qCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    qCtx.fillStyle = '#000'; // Dots/Corners
    qCtx.fillRect(0,0,1,1); qCtx.fillRect(15,0,1,1);
    qCtx.fillRect(0,15,1,1); qCtx.fillRect(15,15,1,1);
    qCtx.fillStyle = '#880000'; // Shadow
    qCtx.fillRect(3, 3, 10, 10); // Question mark BG approximation
    qCtx.fillStyle = '#F89800';
    // Simple ? shape
    qCtx.fillRect(6, 4, 4, 2);
    qCtx.fillRect(10, 4, 2, 4);
    qCtx.fillRect(8, 8, 2, 2);
    qCtx.fillRect(8, 11, 2, 2);
    this.sprites.set('question', qBlock);

    // 4. BLOCK (HARD)
    const block = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const blCtx = block.getContext('2d')!;
    blCtx.fillStyle = '#B85818';
    blCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    blCtx.strokeStyle = '#000';
    blCtx.strokeRect(0,0,TILE_SIZE, TILE_SIZE);
    blCtx.fillRect(TILE_SIZE - 2, 2, 2, TILE_SIZE - 2); // shadow
    this.sprites.set('block', block);

     // 5. PIPE
    const pipe = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const pCtx = pipe.getContext('2d')!;
    pCtx.fillStyle = '#00A800';
    pCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    pCtx.fillStyle = '#006000'; // Darker shader
    pCtx.fillRect(2, 0, 4, TILE_SIZE);
    pCtx.fillRect(12, 0, 2, TILE_SIZE);
    pCtx.fillStyle = '#80D010'; // Highlight
    pCtx.fillRect(6, 0, 2, TILE_SIZE);
    this.sprites.set('pipe', pipe);

    // 6. MARIO (Stand)
    const marioStand = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const mCtx = marioStand.getContext('2d')!;
    this.drawPixelMario(mCtx, false);
    this.sprites.set('mario_stand', marioStand);

    // 7. MARIO (Run) - simplified animation
    const marioRun = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const mrCtx = marioRun.getContext('2d')!;
    this.drawPixelMario(mrCtx, true);
    this.sprites.set('mario_run', marioRun);

    // 8. GOOMBA
    const goomba = this.createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const goCtx = goomba.getContext('2d')!;
    this.drawPixelGoomba(goCtx, 0);
    this.sprites.set('goomba', goomba);
  }

  // Helper to draw a simple 16x16 mario pixel art
  private drawPixelMario(ctx: CanvasRenderingContext2D, isRun: boolean) {
    const R = '#D82800'; // Red
    const B = '#887000'; // Brown (Skin/Hair) - NES classic actually used weird colors, we'll use classic art colors
    const S = '#FC9838'; // Skin
    const O = '#0058F8'; // Blue Overalls

    // Simplified 12x16 Mario centered
    // Hat
    ctx.fillStyle = R; ctx.fillRect(3, 0, 10, 2);
    // Head
    ctx.fillStyle = S; ctx.fillRect(3, 2, 7, 1); ctx.fillStyle = '#000'; ctx.fillRect(10,2,1,1); // Eye/Hair
    ctx.fillStyle = S; ctx.fillRect(3, 3, 9, 1); ctx.fillStyle = '#000'; ctx.fillRect(11,3,1,1); // Moustache
    ctx.fillStyle = S; ctx.fillRect(3, 4, 10, 1);
    // Torso
    ctx.fillStyle = O; ctx.fillRect(4, 5, 6, 7); // Overalls
    ctx.fillStyle = R; ctx.fillRect(2, 6, 3, 3); ctx.fillRect(9, 6, 3, 3); // Sleeves
    ctx.fillStyle = '#F8D820'; ctx.fillRect(5, 8, 1, 1); ctx.fillRect(8, 8, 1, 1); // Buttons

    if (isRun) {
        // Legs spread
        ctx.fillStyle = O;
        ctx.fillRect(1, 12, 4, 3);
        ctx.fillRect(10, 10, 4, 3);
    } else {
        // Legs straight
        ctx.fillStyle = O;
        ctx.fillRect(2, 12, 4, 4);
        ctx.fillRect(8, 12, 4, 4);
    }
  }

  private drawPixelGoomba(ctx: CanvasRenderingContext2D, frame: number) {
    const B = '#B84C08'; // Brown
    const S = '#FCBCB0'; // Skin/Stem
    const K = '#000000';

    // Head
    ctx.fillStyle = B;
    ctx.beginPath(); ctx.moveTo(4,12); ctx.lineTo(2,4); ctx.lineTo(8,0); ctx.lineTo(14,4); ctx.lineTo(12,12); ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFF'; ctx.fillRect(4, 5, 3, 4); ctx.fillRect(9, 5, 3, 4);
    ctx.fillStyle = K; ctx.fillRect(5, 6, 1, 2); ctx.fillRect(10, 6, 1, 2);

    // Feet (Animation toggle)
    ctx.fillStyle = K;
    if (frame % 20 < 10) {
        ctx.fillRect(2, 12, 4, 4); ctx.fillRect(10, 12, 4, 4);
    } else {
        ctx.fillRect(0, 11, 4, 4); ctx.fillRect(12, 11, 4, 4);
    }
  }

  public drawLevel(level: TileType[][], cameraX: number) {
    // Only draw visible tiles
    const startCol = Math.floor(cameraX / TILE_SIZE);
    const endCol = startCol + (this.ctx.canvas.width / TILE_SIZE) + 1;

    for (let y = 0; y < level.length; y++) {
      for (let x = startCol; x <= endCol; x++) {
        if (x >= 0 && x < level[y].length) {
          const tile = level[y][x];
          const px = Math.floor(x * TILE_SIZE - cameraX);
          const py = Math.floor(y * TILE_SIZE);

          if (tile === TileType.GROUND) this.ctx.drawImage(this.sprites.get('ground')!, px, py);
          else if (tile === TileType.BRICK) this.ctx.drawImage(this.sprites.get('brick')!, px, py);
          else if (tile === TileType.QUESTION) this.ctx.drawImage(this.sprites.get('question')!, px, py);
          else if (tile === TileType.BLOCK) this.ctx.drawImage(this.sprites.get('block')!, px, py);
          else if (tile === TileType.PIPE_L) this.ctx.drawImage(this.sprites.get('pipe')!, px, py);
          else if (tile === TileType.PIPE_R) this.ctx.drawImage(this.sprites.get('pipe')!, px, py); // Reuse for now, or flip
          else if (tile === TileType.FLAG_POLE) {
              this.ctx.fillStyle = '#28C048'; this.ctx.fillRect(px + 6, py, 4, TILE_SIZE);
          }
        }
      }
    }
  }

  public drawEntity(entity: Entity, cameraX: number) {
    const px = Math.floor(entity.pos.x - cameraX);
    const py = Math.floor(entity.pos.y);

    if (entity.type === EntityType.PLAYER) {
      const spriteName = Math.abs(entity.vel.x) > 0.1 ? 'mario_run' : 'mario_stand';
      const sprite = this.sprites.get(spriteName)!;

      this.ctx.save();
      if (entity.vel.x < 0) {
        this.ctx.translate(px + TILE_SIZE, py);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(sprite, 0, 0);
      } else {
        this.ctx.drawImage(sprite, px, py);
      }
      this.ctx.restore();
    } else if (entity.type === EntityType.GOOMBA) {
        const sprite = this.sprites.get('goomba')!;
        // Flatten if dead
        if (entity.dead) {
             this.ctx.drawImage(sprite, 0, 0, TILE_SIZE, TILE_SIZE, px, py + 8, TILE_SIZE, TILE_SIZE/2);
        } else {
             this.ctx.drawImage(sprite, px, py);
        }
    }
  }
}