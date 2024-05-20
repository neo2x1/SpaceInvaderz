/* Global variables and functions */
var SPRITESIZEX = 12
var SPRITESIZEY = 8
// unused saucer on top --- var mothershipTable = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];

/*player singleton*/

let Player = 
{   
    sprite:0,
    x: 1920/2,
    input: {},
    shot: null, //original game code allowed for only one shot at a time, so no shots array today...
}


/*
    tuh bazic monsta',
    the class containing the invaders has it's x and y, 
    width and height, sprite type, frame, life ,and points upon kill
*/

class Alien
{
    constructor(x, y, sprite, points, hitpoints)
    {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.frame = 0;
        this.points = points;
        this.alive = true;
        this.hitpoints = hitpoints
    }
    nextframe()
    {       
            this.frame++;
            if(this.frame > 1) this.frame = 0;
    }
    hit()
    {
        this.hitpoints--;
        if(this.hitpoints <= 0)
        {
            //evaporate poor invader from existance 🤌 🫴🟣
            this.alive = false;
            AlienArmy.killed ++; //add to kill counter
        }
    }
}

/* Alien army singleton has every alien and moves*/
class AlienArmy
{
    static killed = 0;
    constructor(level)
    {   
        this.leftmost = 0;
        this.rightmost = 10;
        this.colsize = 11;
        this.alienarray = [];
        this.direction = true;
        this.AlienBullets = [];
        this.bottom = 4;

        for(let row=0; row<5; row++)
        {
            for(let column=0; column<11; column++)
            {
                this.alienarray.push(new Alien(
                    column*(SPRITESIZEX*8)+ 32*column, //x calculated by position in array of aliens (imaginary 11x5 matrix)
                    row*(SPRITESIZEY*8) + 32*row + level*8, //y calculated by position in array of aliens and level of game (8 pixels per level) (imaginary 11x5 matrix)
                    2-Math.ceil(row/2), //type of alien calculated by row minus whole 
                    10*(Math.ceil(row/2)), //points based of position
                    Math.floor(level/3)+1 //hp based of level (adds 1 every 3 levels)
                ))
            }
        }
    }

}

/* game singleton
    calc delta time every iteration basically the whole game
    calls everything needed 
    could have make this an classles object but a) it is too big to revert back now b) start upon constructing is good enough 
*/
class Game{
    
    constructor(level)
    {
        this.level = level;
        this.nextLevel(this.level);
    }
    //main game loop
    gameLoop()
    {   
            // calc deltatime
            if(!this.stopped)
            {
                this.deltatime = Date.now()-this.lastTime;
                this.lastTime = Date.now();

                //gameloop
                this.input();
                this.update();
                this.draw();
            }
    }
    //this func is soely to remove the 500 ms delay from pressing key on keyboard
    input()
    {
        if(Player.input["ArrowLeft"])
        {
            if(Player.x>0)    
            {  
                Player.x -= 800*this.deltatime/1000;
            }
            else //if somehow player finds himself out of bounds
            {
                Player.x=0;
            }
        }
        if(Player.input["ArrowRight"])
        {
            if(Player.x+SPRITESIZEX*8<1920)    
            {  
                Player.x += 800*this.deltatime/1000;
            }
            else //if somehow player finds himself out of bounds
            {
                Player.x=1920-SPRITESIZEX*8;
            }
        }
        if(Player.input["z"] && Player.shot == null)
        {
            Player.shot = {x: Player.x+SPRITESIZEX*3+4, y: 1000}
        }
    }
    //updates: alien position player shot position, detects colision etc. etc.
    update()
    {
        //add timer for aliens
        this.timer += this.deltatime;
        this.shootimer += this.deltatime;

        let speedOfEnemy = (650*(AlienArmy.killed/55)) //speed up enemy by how much killed
        if(this.timer > 750-speedOfEnemy)  
        {
            this.timer = 0;
            for(let i = 0; i<this.aleins.alienarray.length; i++)
            {
                if(this.aleins.direction)
                    this.aleins.alienarray[i].x += 24;
                else
                    this.aleins.alienarray[i].x -= 24;
                this.aleins.alienarray[i].nextframe();
            }
            
            //check if army collided wall
            if(
                (this.aleins.alienarray[this.aleins.rightmost].x+SPRITESIZEX*8)>=1920 || //right
                (this.aleins.alienarray[this.aleins.leftmost].x)<=0 //left
            )
            {
                // direction flipendo
                this.aleins.direction = !this.aleins.direction
                //move aliens down
                for(let i = 0; i<this.aleins.alienarray.length; i++)
                {
                    this.aleins.alienarray[i].y += 6*8;
                }
                
            }
            // check if alien has moved beyond deathline
            if(this.aleins.alienarray[this.aleins.bottom*11].y+SPRITESIZEY*8>900)
            {
                this.killplayer();
            }
            
        }
        if(this.shootimer > 500) //every 0.5 seconds
        {
            this.shootimer = 0;
            if(Math.floor(Math.random()*5)==4) //aliens have 1/5 chance to shoot
            {   
                let randomAlien=Math.floor(Math.random()*this.killedaliens.length)
                this.aleins.AlienBullets.push(
                {
                    x: this.aleins.alienarray[this.killedaliens[randomAlien]].x + SPRITESIZEX/2*8 , 
                    y:this.aleins.alienarray[this.killedaliens[randomAlien]].y+64
                })
            }
        } 
        // player shot
        if(Player.shot != null)
        {
            //update player bullet position
            Player.shot.y -= 800*this.deltatime/1000;
            
            //check if shot hit the invader hitbox (8x8 square in the middle)
            for(let i =0; i < this.aleins.alienarray.length; i++)
            {   
                
                if(this.aleins.alienarray[i].alive)
                {
                    if
                    ( //if bullet colided with enemy
                    Game.colide(
                    Player.shot.x, this.aleins.alienarray[i].x+16, 
                    Player.shot.y, 
                    this.aleins.alienarray[i].y, 
                    32, 64, 16 ,80-16
                    ))
                    {

                        //hit alien
                        this.aleins.alienarray[i].hit();
                        if(!this.aleins.alienarray[i].alive)
                        {
                            this.killedaliens.splice(this.killedaliens.indexOf(i),1); //remove alien position from killed aliens
                        }
                        //next level if it was last alien 
                        if(AlienArmy.killed == 55)
                        {
                            setTimeout(() => {
                                if(this.level<6) // killscreen won't occur
                                {
                                    this.level++;
                                }
                                
                                this.nextLevel(this.level);
                            }, 1000);
                        }
                        //check for if alien edge row wasn't killed
                        //check rightmost alien
                        for(let i = 10; i>=0; i--)
                        {
                            for(let j = 0; j < 5; j++)
                            {
                                if(this.aleins.alienarray[((j*11)+i)].alive)
                                {
                                    this.aleins.rightmost = i;
                                    i=0; // doesnt loop unnecessarily
                                    break;
                                }
                            }
                        }
                        //check leftmost alien
                        for(let i = 0; i <11; i++)
                        {
                            for(let j = 4; j>=0; j--)
                            {
                                if(this.aleins.alienarray[((j*11)+i)].alive)
                                {
                                this.aleins.leftmost = i;
                                i=11; // doesnt loop unnecessarily
                                break;
                                }
                            }
                        }
                        //check bottomost alien
                        for(let j = 4; j>=0; j--)
                        {
                            for(let i = 10; i >= 0; i--)
                            {
                                if(this.aleins.alienarray[((j*11)+i)].alive)
                                {
                                    this.aleins.bottom = j;
                                    j=0; // doesnt loop unnecessarily
                                    break;
                                }
                            }
                        }
                        Player.shot = null;
                        break;
                    }
                }
            } 
            //if enemy was killed dont check
            if (Player.shot != null)
            {
                if(Player.shot.y < 0)
                {
                    Player.shot = null;
                }
            }
        }
        //do things with enemy bullet
        for(let i = 0;i<this.aleins.AlienBullets.length;i++)
        {
            this.aleins.AlienBullets[i].y += 800*this.deltatime/1000;
            if(this.aleins.AlienBullets[i].y > 1080)
            {
                this.aleins.AlienBullets.splice(i,1);
                break;
                
            }
            if
                ( //if enemy colided with us
                Game.colide(
                Player.x, this.aleins.AlienBullets[i].x, 
                1000, 
                this.aleins.AlienBullets[i].y, 
                64, 32, 80-32,16 
                ))
                {
                    this.killplayer();
                }
        }
            
    }
    draw()
    {   

        this.display.clearRect(0,0,1920,1080)
        //draw invaders
        for(let alien of this.aleins.alienarray)
        {
            if(alien.alive)
                this.display.drawImage(
                    this.spriteSheet, 
                    alien.frame*SPRITESIZEX, alien.sprite*SPRITESIZEY,
                    SPRITESIZEX, SPRITESIZEY,
                    alien.x,alien.y,SPRITESIZEX*8, SPRITESIZEY*8
            )
        }
        //draw player
        this.display.drawImage(
            this.spriteSheet,
            Player.sprite*12,8*3,12,8,
            Player.x,
            1000,
            SPRITESIZEX*8,
            SPRITESIZEY*8
        );
        //draw shot
        if(Player.shot!=null)
        {
            this.display.fillStyle = "white";
            this.display.beginPath();
            this.display.rect(Player.shot.x, Player.shot.y, 16,32);
            this.display.fill();
        }
        //draw alien bullets
        for(let bullet of this.aleins.AlienBullets)
        {
            this.display.fillStyle = "white";
            this.display.beginPath();
            this.display.rect(bullet.x, bullet.y, 16,32);
            this.display.fill();
        }
        //draw safeline
        this.display.fillStyle = "rgba(255,0,0,0.3)";
        this.display.beginPath();
        this.display.rect(0, 900, 1920, 8);
        this.display.fill();
    }    
    static colide(x1,x2,y1,y2,height1,height2,width1,width2)
    {
        return x1 < x2+width2 && // left of one object intersects with right
            x1+width1 > x2 && // right of bullet more than left point
            y1 < y2+height2 && //top of a bullet more than bottom of enemy
            y1+height1 > y2 //bottom of a bullet less than top of enemy
    }
    nextLevel(level)
    {
        this.stopped = false;
        // this and Game.input() solves the 500 ms delay for the continous button press
        document.addEventListener("keydown",(e)=>{ Player.input[e.key]=true;});
        document.addEventListener("keyup",(e)=>{Player.input[e.key]=false;});

        Player.sprite=0;

        this.lastTime = Date.now();
        this.deltatime = Date.now() - this.lastTime;
        this.display = document.getElementById("canva").getContext("2d");
        this.display.imageSmoothingEnabled = false;
        this.timer =0;
        this.shootimer=0;
        this.spriteSheet = new Image(24,24);
        this.spriteSheet.src = "./sprites/invaders.png";
        
        //could set request animation frame for solid 60 fps but i prefer working with delta time
        this.spriteSheet.onload = setInterval(()=>this.gameLoop(), 0);


        this.killedaliens = []
        for(let i =0; i<55; i++)
        {
            this.killedaliens.push(i);
        }
        console.log(this.killedaliens.length)
        //set aliens
        AlienArmy.killed = 0;
        this.aleins = new AlienArmy(level); 
    }
    killplayer()
    {
        Player.sprite = 1;
        this.stopped = true; //no input or enemies
        setTimeout(() => {
            this.level = 0; //reset game from square one
            this.nextLevel(this.level);
        }, 500);
    }
}