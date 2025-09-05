import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError, Observable, retry, throwError} from 'rxjs';
import { Task } from '../components/types/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    if (error.status === 0) {
      return throwError(() => new Error('Сервер недоступен. Проверьте подключение.'));
    } else if (error.status >= 400 && error.status < 500) {
      const message = error.error?.message || 'Ошибка в запросе.';
      return throwError(() => new Error(message));
    } else if (error.status >= 500) {
      return throwError(() => new Error('Внутренняя ошибка сервера.'));
    }
    return throwError(() => new Error('Неизвестная ошибка.'));
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      retry(3),
      catchError(err => this.handleError(err))
    );
  }

  createTask(task: { title: string; completed: boolean }): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      retry(2),
      catchError(err => this.handleError(err))
    );
  }

  updateTask(id: string, changes: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, changes).pipe(
      retry(2),
      catchError(err => this.handleError(err))
    );
  }

  deleteTask(id: string){
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      retry(2),
      catchError(err => this.handleError(err))
    );
  }

}
