import { ApplicationConfig, Component, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { TabFrame } from './tab-frame';

@Component({ template: '' })
class Blank {}   // "/" until the tab list arrives (App then opens the first tab)

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter([{ path: '', component: Blank, pathMatch: 'full' }, { path: ':id', component: TabFrame }], withComponentInputBinding()),
  ],
};
