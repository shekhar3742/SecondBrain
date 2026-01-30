// import dotenv from 'dotenv'
// dotenv.config()
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ContentModel, LinkModel, UserModel } from './db'
import { JWT_SECRET } from './config'
import { userMiddleware } from './middleware'
import { random } from './utils'
import cors from 'cors'
import mongoose from 'mongoose'

mongoose.connect(
  "mongodb+srv://divyanshushekhar3742:Rahul%403742@cluster0.v31fh2c.mongodb.net/Brainly"
);


const app = express()
app.use(cors({
  origin: [
    "http://localhost:5173",    
     "https://second-brain-c7ye-git-main-shekhar3742s-projects.vercel.app",
  ],
  credentials: true
}));
app.use(express.json())

const PORT =  4002;

//signup route
app.post('/api/v1/signup/', async (req, res) => {
    
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            msg: "Missing inputs"
        })
    }

    try {
        
        const salt = await bcrypt.genSalt(5);
        const hashPassword = await bcrypt.hash(password, salt);

        await UserModel.create({
            username: username,
            password: hashPassword
        })

        return res.status(200).json({
            msg: "Signed up"
        })
    } catch (err: any) {
        if (err.code === 11000) {
           
            return res.status(409).json({
                msg: "User already exists"
            });
        }

        
        console.error("Signup error:", err);
        return res.status(500).json({
            msg: "Something went wrong",
            error: err.message
        });
    }

})

app.post('/api/v1/signin/', async (req, res) => {
    try {
        const username = req.body.username
        const password = req.body.password

        if (!username || !password) {
            return res.status(401).json({
                msg: "username & password required"
            })
        }

        const user = await UserModel.findOne({
            username
        })

        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) {
            return res.status(401).json({
                msg: "Invalid password"
            })
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, JWT_SECRET)

        return res.status(200).json({
            msg: "Login successful",
            token,
        });

    } catch (error) {
        console.log("Signin error");

        return res.status(411).json({
            msg: "Something went wrong",
            error: error
        })
    }
})

app.post('/api/v1/content/', userMiddleware, async (req, res) => {
    const link = req.body.link;
    const type = req.body.type;
    const title = req.body.title;

    await ContentModel.create({
        title,
        link,
        type,
        //@ts-ignore-
        userId: req.userId,
        tags: []
    })

    res.json({
        msg: "content added"
    })

})

app.get('/api/v1/content/', userMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId")

    res.json({
        content
    })
})

app.delete('/api/v1/content/:id', userMiddleware, async (req, res) => {
    const contentId = req.params.id;

    await ContentModel.deleteOne({
        _id: contentId,
        //@ts-ignore
        userId: req.userId
    })

    res.json({
        msg: "content deleted"
    })
})

app.post('/api/v1/brain/share', userMiddleware, async (req, res) => {
    const share = req.body.share;
    try {
        if (share) {
            
            const existingLink = await LinkModel.findOne({
                //@ts-ignore
                userId: req.userId
            })
            if (existingLink) {
                return res.json({
                    hash: existingLink.hash
                })
            }

           
            const hash = random(10)
            await LinkModel.create({
                //@ts-ignore
                userId: req.userId,
                hash
            })

            res.json({
                msg: "Updated share link",
                hash
            })

        } else {
            await LinkModel.deleteOne({
                //@ts-ignore
                userId: req.userId
            })

            res.json({
                msg: "Link removed"
            })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Something went wrong" });
    }
})

app.get('/api/v1/brain/:shareLink', async (req, res) => {
    const hash = req.params.shareLink

   
    const link = await LinkModel.findOne({
        hash
    })

    if (!link) {
        return res.status(411).json({
            msg: "Invalid link"
        })
    }

   
    const content = await ContentModel.find({
        userId: link.userId
    })

    const user = await UserModel.findOne({
        _id: link.userId
    });

    if (!user) {
        return res.status(411).json({
            msg: "User not found"
        })
    }
   
    res.json({
        username: user.username,
        content
    })
})


app.listen(PORT, () => {
    console.log(`Server is running at port: ${PORT}`);
});