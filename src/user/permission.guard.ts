import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from 'rxjs';
import { UserService } from "./user.service";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class PermissionGuard implements CanActivate {

  @Inject(UserService)
  private userService: UserService

  @Inject(Reflector)
  private reflector: Reflector

  @Inject(RedisService)
  private redisService: RedisService

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>  {
    // console.log(this.userService);
    const request:Request = context.switchToHttp().getRequest()

    const user = request.session.user
    if(!user) {
      throw new UnauthorizedException('user not login')
    }

    /**
     * 下面的方法需要有三个表的关联查询
     */
    // const foundUser = await this.userService.findByUsername(user.username)
    // console.log(foundUser);
    // const permission = this.reflector.get('permission',context.getHandler())
    // console.log(permission);
    //
    // if(foundUser.permissions.some(item => item.name ===permission)){
    //   return true
    // } else {
    //   throw new UnauthorizedException('没有权限访问该接口')
    // }


    /**
     * 使用redis缓存关系数据 ，实现优化
     */
    let permissions =  await this.redisService.listGet(`user_${user.username}_permissions`)

    if(!permissions?.length) {
      const foundUser = await this.userService.findByUsername(user.username)
      permissions = foundUser.permissions.map(item => item.name)

      await this.redisService.listSet(`user_${user.username}_permissions`, permissions, 60*30)
    }
    const permission = this.reflector.get('permission', context.getHandler())

    if(permissions.some(item => item === permission)) {
      return true
    } else {
      throw new UnauthorizedException('没有权限访问该接口')
    }



  }
}
