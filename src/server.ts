import express, { Request, Response, NextFunction, ErrorRequestHandler, } from "express"
import dotenv from 'dotenv'
import { request } from "node:http";


//Load env variable
dotenv.config()

//create express application

const app = express()

app.use(express.json()); // lets express read json request body from client

interface Service {
    id: number; name: string; price: number; durationMinutes: number;
}
type ServiceInput = Omit<Service, "id">;

const services: Service [] = [ 
    { id: 1, name: "Haircut", price: 5000, durationMinutes: 30 },
    {id: 2, name: "Braiding", price: 15000, durationMinutes: 160}
];
let nextId = 3;


//Checks the body and return error message, or null if valid (validation)
function validateService(body: unknown): string | null {
    const { name, price, durationMinutes } = (body ?? {} ) as Partial<ServiceInput>;

    if ( typeof name !== "string" || name.trim() === "") {
        return "Name is required";
    }
    if ( typeof price !== "number" || price < 0 ) {
        return "Price must be a number of 0 or more";
    }
    if (!Number.isInteger(durationMinutes) || (durationMinutes as number) <= 0 ) {
        return "durationMinutes must be a whole number above 0";
    }
    return null;
}


//List all services

app.get("/services", (req: Request, res: Response) => {
    const maxPrice = req.query.maxPrice;
    if (typeof maxPrice === "string") {
        res.json(services.filter( (s) => s.price <= Number(maxPrice)));
        return
    }
     res.json(services);
});

//Get one service
app.get("/services/:id", (req:Request,res:Response) => {
    const id:number = Number(req.params.id);
    const service = services.find( (s) => s.id === id );

    if (!service) {
        return res.status(404).json({ error: "Service not found"});
    }
    res.json(service);
});

//creating a new service
app.post("/services", (req:Request, res:Response) => {
    const error = validateService(req.body);
    if (error) {
        res.status(400).json({ error });
        return;
    }

    const { name, price, durationMinutes } = req.body as ServiceInput;
    const service: Service = {
        id: nextId++,
        name: name.trim(),
        price,
        durationMinutes,
    };
    services.push(service)

    res.status(200).json(service)
});

//Update services

app.put("/services/:id", (req:Request, res:Response) => {
    const service = services.find((s) => s.id === Number(req.params.id))

    if (!service) {
        res.status(404).json( { error: "Service not found "});
        return
    }

    const error = validateService(req.body);
    if (error) {
        res.status(400).json({error});
        return
    }

    const { name, price, durationMinutes } = req.body as ServiceInput
    service.name = name.trim();
    service.price = price;
    service.durationMinutes = durationMinutes;

    res.json(service)
});


//Delete services
app.delete("/services/:id", (req:Request, res:Response) => {
    const index = services.findIndex((s) => s.id === Number(req.params.id));
    if (index === -1 ) {
        res.status(404).json({ error: "Service not found"});
        return
    }

    services.splice(index, 1);
    res.status(204).send()
});

//Unknown routes
app.use((req: Request, res:Response) => {
    res.status(404).json({ error: "Route not found"});
});


//Error handling middleware (must be last with 4 parameters)

const errorHandler: ErrorRequestHandler = (
    err: Error & { type?: string },
    req: Request,
    res: Response,
    next: NextFunction 
    ) => {
        console.error(err);
        if (err.type === "entity.parse.failed") {
            res.status(400).json( { error: "invalid JSON in request body"})
            return
        }
        res.status(500).json({ error: "Something went wrong"})
    };
    app.use(errorHandler);




const port: number = Number(process.env.port) || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});