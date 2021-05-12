import Signal from "./signal.js";

export class SpriteAnimation {

    constructor({ name = '', frameStart = 0, frameEnd, delay = 100, autoStart = true }) {
        
        this.sprite      = null;

        this.frameStart   = frameStart;
        this.frameEnd    = frameEnd;

        this.name        = name;
        this.delay       = delay;
        this.currentStep = this.frameStart;
        this.autoStart   = autoStart;
        this.hasStarted  = false;
        this.isRunning   = false;
    
    }

    start() {
        
        if(!this.hasStarted) {
            this.hasStarted = true;
            this.isRunning  = true;
            this.sprite.onAnimationStart.emit(this.name);
        }
    
    }

    pause() {
        
        if(this.isRunning && this.hasStarted) {
            this.isRunning = false;
        }
    
    }

    stop() {
        
        if(this.hasStarted) {
            this.hasStarted  = false;
            this.isRunning   = false;
            this.currentStep = this.frameStart;
            this.sprite.onAnimationStop.emit(this.name);
        }
    
    }

    next() {

        if(this.isRunning) {
            this.currentStep++;
            if(this.currentStep > this.frameEnd) {
                this.currentStep = this.frameStart;
                this.sprite.onAnimationEnd.emit(this.name);
            }
        }

        return this.currentStep;
    
    }

}

export class AnimatedSprite {

    onAnimationStart = new Signal()

    onAnimationEnd   = new Signal()

    onAnimationStop  = new Signal()

    constructor({ spritesheet, columns, rows, frameWidth, frameHeight, width, height }) {

        this.spritesheet      = spritesheet;
        
        this.numCol           = columns;
        this.numRow           = rows;

        this.frameWidth       = frameWidth  || this.spritesheet.width / this.numCol;
        this.frameHeight      = frameHeight || this.spritesheet.height / this.numRow;

        this.width            = width || this.frameWidth;
        this.height           = height || this.frameHeight;

        this.maxFrames        = this.numCol * this.numRow - 1;

        this.animations       = new Map;
        this.currentFrame     = null;
        this.currentAnimation = null;

        this.flipX            = false;
        this.flipY            = false;

        this.rotation         = 0;

        this.then             = null;
    
    }

    draw(ctx, x, y) {

        if(!this.currentAnimation) throw new Error(
            `Can't Draw AnimatedSprite. No Animation has been set.`
        );

        const now = performance.now();
  
        if(!this.then || (now - this.then) >= this.currentAnimation.delay) {
            this.currentFrame = this.currentAnimation.next();
            this.then = now;
        }

        const col = this.currentFrame % this.numCol;

        const row = Math.floor(this.currentFrame / this.numCol);

        ctx.save();

        if(this.flipX || this.flipY || this.rotation > 0) {
            ctx.translate(x + this.width / 2, y + this.width / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.scale(
                this.flipX ? -1 : 1, 
                this.flipY ? -1 : 1
            );
            ctx.translate(-(x + this.width / 2), -(y + this.width / 2));
        }
  
        ctx.drawImage(
            this.spritesheet, 
            col * this.frameWidth, 
            row * this.frameHeight, 
            this.frameWidth, 
            this.frameHeight, 
            x, 
            y, 
            this.width, 
            this.height
        );
  
        ctx.restore();

    }


    addAnimation(name, animation) {

        if(this.animations.has(name)) throw new Error(
            `Animation with name ${name} already exists`
        );
        
        animation.name   = name;
    
        animation.sprite = this;

        if(animation.frameEnd == null) {
            animation.frameEnd = this.maxFrames;
        }
    
        this.animations.set(name, animation);
    
        if(!this.currentAnimation) {
            this.setAnimation(name);
        }
    
    }

    setAnimation(animationName) {

        if(!this.animations.has(animationName)) throw new Error(
            `Animation with name ${animationName} does not exists.`
        )

        if(this.currentAnimation && animationName === this.currentAnimation.name) return;

        this.stopAnimation();

        this.currentAnimation = this.animations.get(animationName);

        if(this.currentAnimation.autoStart) {
            this.currentAnimation.start();
        }

        this.then = null;

    }

    startAnimation() {
        this.currentAnimation?.start();
    }

    stopAnimation() {
        this.currentAnimation?.stop();
    }

}
