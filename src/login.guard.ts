import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from 'rxjs';
import { Request } from "express";


declare module 'express-session' {
  interface Session {
    user: {
      username: string
    }
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request:Request = context.switchToHttp().getRequest()

    if(!request.session?.user) {
      throw new UnauthorizedException('user not login')
    }

    return true;
  }
}
