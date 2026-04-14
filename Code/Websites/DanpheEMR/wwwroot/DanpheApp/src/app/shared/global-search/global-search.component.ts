import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FocusedElementService } from './shared/focused-element.service';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.css']
})
export class GlobalSearchComponent implements OnInit {
  // ClinicalPhrases: any = [];
  IsVisible: boolean = false;
  SearchTerm: string = '';
  SelectedIndex: number = -1;
  @ViewChild('searchBox') SearchBox!: ElementRef;
  @ViewChild('scrollContainer') ScrollContainer!: ElementRef;
  constructor(
    public FocusedElementService: FocusedElementService,

  ) {

  }

  ngOnInit() {

  }
  /**
   * Toggles the visibility of the search box. If it is currently visible, it will be hidden, and vice versa.
   * Also clears the search term when toggling the visibility
   */
  ToggleSearchBox() {
    this.IsVisible = !this.IsVisible;
    this.SearchTerm = '';
  }

  FocusSearch() {
    setTimeout(() => {
      this.SearchBox.nativeElement.focus();
    }, 0);
  }

  /**
   * Global keypress handler. Listens for 'ALT + T' key combination and toggles the search box when pressed.
   * Prevents the default browser behavior for this key combination.
   * @param event - The keyboard event triggered by key press.
   */
  @HostListener('window:keydown', ['$event'])
  HandleKeyDown(event: KeyboardEvent) {
    if (event.altKey && event.key === 't') {
      this.ToggleSearchBox();
      event.preventDefault();
      this.SetDefaultFeature();
      this.SetCursorPosition();
      if (this.IsVisible) {
        this.FocusSearch();
      }
    } else if (event.keyCode == 27) {
      this.Close();
    }
  }

  SetCursorPosition() {
    this.FocusedElementService.SetCursorPosition();
  }


  /**
   * Closes the search box by setting the 'IsVisible' flag to false.
   */
  Close() {
    this.IsVisible = false;
  }

  /**
   * Handles the change of the selected option.
   * Calls the HandleOptionChange method from the FocusedElementService to perform actions based on the selected option.
   */
  OnOptionChange(): void {
    this.FocusedElementService.HandleFeatureChange();
  }

  /**
   * Sets the default feature by selecting the first option from the GlobalSearchFeatureOptions.
   * If there are options available, it sets the SelectedOption to the first one in the list
   * and triggers the OnOptionChange method to handle any necessary updates.
   */
  SetDefaultFeature() {
    if (this.FocusedElementService.GlobalSearchFeatureOptions && this.FocusedElementService.GlobalSearchFeatureOptions.length > 0) {
      this.FocusedElementService.SelectedFeature = this.FocusedElementService.GlobalSearchFeatureOptions[0];
      this.OnOptionChange();
    }
  }

  get FilteredItems() {
    return this.FocusedElementService.GlobalSearchKeywords.filter((item) => {
      if (item && item.KeywordDisplayName)
        return item.KeywordDisplayName.toLowerCase().includes(this.SearchTerm.toLowerCase())
      else
        return false;
    });
  }

  /**
   * Handles keyboard navigation and selection in the filtered list.
   * - ArrowDown: Moves the selection down in the list.
   * - ArrowUp: Moves the selection up in the list.
   * - Enter: Selects the currently highlighted item.
   *
   * @param {KeyboardEvent} event - The keyboard event triggered by user interaction.
   */
  OnKeyDown(event: KeyboardEvent) {
    const itemsCount = this.FilteredItems.length;

    if (event.key === 'ArrowDown') {
      if (this.SelectedIndex < itemsCount - 1) {
        this.SelectedIndex++;

      }
      event.preventDefault();
      this.ScrollIntoView();
    } else if (event.key === 'ArrowUp') {
      if (this.SelectedIndex > 0) {
        this.SelectedIndex--;

      }
      event.preventDefault();
      this.ScrollIntoView();
    } else if (event.key === 'Enter') {
      this.SelectItem(this.SelectedIndex);
    }

  }

  /**
   * Selects an item from the filtered list based on the index.
   * - Updates the selected index.
   * - Passes the selected item to a service for handling the selection.
   * - Closes or toggles the search box after selection.
   *
   * @param {number} index - The index of the item to select.
   */
  SelectItem(index: number) {
    if (index >= 0 && index < this.FilteredItems.length) {
      const selectedItem = this.FilteredItems[index];
      this.SelectedIndex = index;
      this.FocusedElementService.HandleSearch(this.FilteredItems[index]);
      this.ToggleSearchBox();
    }
  }

  /**
   * Scrolls the currently selected item into view within the search list.
   * - Smoothly scrolls to the item based on its position in the list.
   */
  ScrollIntoView() {
    const listItems = this.ScrollContainer.nativeElement.querySelectorAll('li');
    if (listItems[this.SelectedIndex]) {
      listItems[this.SelectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  /**
 * Prevents the click event from propagating up to parent elements.
 * - Useful when clicking inside a popup or modal to avoid closing it by accident.
 *
 * @param {Event} event - The event that triggered the click.
 */
  StopPropagation(event: Event) {
    event.stopPropagation();
  }

}
