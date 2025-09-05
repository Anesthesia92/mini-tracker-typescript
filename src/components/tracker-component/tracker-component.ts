import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import {TableModule} from 'primeng/table';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Toolbar} from 'primeng/toolbar';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';

import {FormsModule} from '@angular/forms';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {Task} from '../types/task.interface';
import {ConfirmationService, MessageService} from 'primeng/api';
import {TaskService} from '../../services/task-service';
import {Toast} from 'primeng/toast';
import {Subscription} from 'rxjs';
import {Card} from 'primeng/card';

@Component({
  selector: 'app-tracker-component',
  imports: [
    FormsModule,
    Dialog,
    Tag,
    InputText,
    TableModule,
    InputText,
    Toolbar,
    Button,
    Tag,
    Dialog,
    FormsModule,
    ConfirmDialog,
    Toast,
    Card
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tracker-component.html',
  styleUrl: './tracker-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerComponent implements OnInit, OnDestroy {
  taskDialog: boolean = false;

  task: Task | any = {};

  submitted: boolean = false;

  dialogSize = {width: '450px', maxWidth: '100%'};
  loading = signal(true);
  tasks = signal<Task[]>([]);

  selectedTasks: WritableSignal<Task[]> = model([]);


  private tasksSubscription?: Subscription;

  constructor(
    private service: TaskService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {
  }

  ngOnInit(): void {
    this.catchTasks();
  }

  catchTasks(){
    this.tasksSubscription = this.service.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks || []);
        this.loading.set(false);
        this.updateTaskSelected();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  updateTaskSelected() {
    this.selectedTasks.set(this.tasks().filter(task => task.completed));
  }

  openNew() {
    this.task = {};
    this.submitted = false;
    this.taskDialog = true;
  }

  hideDialog() {
    this.taskDialog = false;
    this.submitted = false;
    this.loading.set(false);
  }

  delete(task: Task) {
    this.loading.set(true);
    this.confirmationService.confirm({
      message: 'Вы действительно хотите удалить ' + task.title + '?',
      header: 'Подтверждение',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Нет',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Да'
      },
      accept: () => {
        this.task = null;
        this.deleteTask(task);
      },
      reject: () => {
        this.loading.set(false);
      }
    });
  }

  deleteTask(task: Task) {
    this.service.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks.update(tasks => tasks.filter(t => t.id !== task.id));
        this.messageService.add({severity: 'success', summary: 'Удалено', detail: 'Задача удалена'});
        this.hideDialog();
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить задачу'});
        this.loading.set(false);
      }
    });
  }

  getSeverity(completed: boolean) {
    return completed ? 'success' : 'danger';
  }

  toggleCompleted(task: Task) {
    this.loading.set(true);

    this.service.updateTask(task.id, { completed: !task.completed }).subscribe({
      next: updatedTask => {
        const index = this.tasks().findIndex(t => t.id === updatedTask.id);
        if (index !== -1) this.tasks()[index] = updatedTask;
        this.messageService.add({ severity: 'success', summary: 'Обновлено', detail: 'Статус обновлен' });
        this.updateTaskSelected();
      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Ошибка', detail: 'Не удалось обновить статус'})
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  save() {
    this.submitted = true;

    if (this.task?.title?.trim()) {
      this.loading.set(true);
      this.service.createTask({ title: this.task.title, completed: this.task.completed }).subscribe({
        next: newTask => {
          this.messageService.add({ severity: 'success', summary: 'Создано', detail: 'Задача добавлена' });
          this.task = null;
          this.tasks.update(tasks => [...tasks, newTask]);
          this.hideDialog();
        },
        error: () =>
        {
          this.messageService.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось создать задачу' });
          this.loading.set(false);
        },
        complete: () => {
        this.loading.set(false);
      }
      });
    }
  }
}
