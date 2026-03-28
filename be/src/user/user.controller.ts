import { Request, Response } from 'express';
import { UserService, RegisterUserDto } from './user.service.js';
import { asyncHandler } from '../shared/errors/asyncHandler.js';
import { ApiResponse } from '../shared/utils/apiResponse.js';

const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, identifier, password } = req.body;
  const loginValue = identifier || username || email;

  const result = await UserService.login(loginValue, password);
  return res.status(200).json(ApiResponse.success('Login exitoso', result));
});

const register = asyncHandler(async (req: Request, res: Response) => {
  const registerData: RegisterUserDto = req.body;
  const result = await UserService.register(registerData);
  return res.status(201).json(ApiResponse.created('Usuario registrado exitosamente', result));
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await UserService.refreshToken(refreshToken);
  return res.status(200).json(ApiResponse.success('Token renovado', result));
});

export { login, register, refreshToken };
