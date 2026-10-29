import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { TabFramePage } from './features/tab-frame/tab-frame.page';

@Component({ template: '' })
class Blank {} // "/" until the tab list arrives (App then opens the first tab)

export const routes: Routes = [
  { path: '', component: Blank, pathMatch: 'full' },
  { path: ':id', component: TabFramePage },
];
