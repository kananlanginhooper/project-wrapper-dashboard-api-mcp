import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { TabFramePage } from './features/tab-frame/tab-frame.page';

@Component({ template: '' })
class Blank {} // "/" until the tab list arrives (App then opens the first tab)

export const routes: Routes = [
  { path: '', component: Blank, pathMatch: 'full' },
  // /<id>, or /<id>/<page inside the app> for a shared link (the frame page reads the rest)
  {
    matcher: (segs) => (segs.length ? { consumed: segs, posParams: { id: segs[0] } } : null),
    component: TabFramePage,
  },
];
